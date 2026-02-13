from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import tempfile
import os

from db_engine import SessionLocal, initialize_database
from db_models import Project, Zone, Component, Decision, RiskEvent, Model

# Core Logic Imports
try:
    from xgboost_model import risk_model
    from glb_editor import GLBEditor
    from supabase_client import SupabaseStorage
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️ Required modules missing (XGBoost/Editor/Supabase)")

app = FastAPI(title="Strata-Sentinel Enterprise")
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- DATABASE FETCHING (NO HARDCODING) ---

@app.get("/public_glb_models/")
def get_public_models(db: Session = Depends(get_db)):
    """Fetch all models directly from your DBMS."""
    models = db.query(Model).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "glb_url": m.glb_url
        } for m in models
    ]

@app.get("/latest_model/{model_id}")
def get_latest_model(model_id: int, db: Session = Depends(get_db)):
    """Loads the specific URL currently stored in the DB for this model."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found in DBMS")
    return {"glb_url": model.glb_url}

# --- THE EDIT & PERSIST FLOW ---

@app.post("/edit_component/")
async def edit_component(request: dict = Body(...), db: Session = Depends(get_db)):
    """
    1. Loads GLB from DBMS URL
    2. Modifies visual color based on risk
    3. Uploads new version to Supabase
    4. UPDATES DBMS so the new URL is the master version
    """
    comp_id = request.get("component_id")
    model_url = request.get("model_url")
    edit_params = request.get("edit_params", {})

    # 1. Validation
    component = db.query(Component).filter(Component.id == comp_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    zone = db.query(Zone).filter(Zone.id == component.zone_id).first()
    project = db.query(Project).filter(Project.id == zone.project_id).first()

    # 2. Risk Calculation (XGBoost)
    if XGBOOST_AVAILABLE:
        features = [
            edit_params.get("span_length", 10.0),
            edit_params.get("cost_impact", 50000),
            edit_params.get("delay_days", 5.0),
            float(component.dependency_count),
            float(zone.importance_factor),
            1.0, 1.0, # Default weights
            0.7 if edit_params.get("mitigation") else 1.0
        ]
        risk_score, category, explanation = risk_model.predict_risk(features)
    else:
        risk_score, category, explanation = 0.0, "Unknown", "Model Offline"

    # 3. GLB Modification & Supabase Storage
    storage_url = model_url
    if XGBOOST_AVAILABLE:
        try:
            gltf = GLBEditor.load_public_glb(model_url)
            # Red if high risk, Green if mitigated
            color = [0.2, 0.8, 0.2] if edit_params.get("mitigation") else [1.0, 0.3, 0.3]
            gltf = GLBEditor.modify_material(gltf, color=color)

            with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
                glb_data = GLBEditor.save_glb(gltf, tmp.name)
                storage_url = SupabaseStorage.upload_glb(
                    project_id=project.id,
                    model_id=comp_id,
                    glb_data=glb_data,
                    version=f"rev_{int(datetime.utcnow().timestamp())}"
                )
            
            # ✅ PERSISTENCE: Update the Model record in the DBMS
            # This ensures "Next Time" it loads the updated version
            db_model = db.query(Model).filter(Model.id == component.model_id).first()
            if db_model:
                db_model.glb_url = storage_url
                db.commit()

        except Exception as e:
            print(f"❌ Edit Failed: {e}")

    # 4. Log Decision
    decision = Decision(
        component_id=comp_id,
        decision_type="Structural Edit",
        severity=category,
        mitigation_flag=edit_params.get("mitigation", False)
    )
    db.add(decision)
    db.commit()

    return {
        "status": "success",
        "risk_score": risk_score,
        "new_url": storage_url,
        "category": category
    }

# --- MANAGEMENT ENDPOINTS ---

@app.post("/upload_model/")
def upload_model(project_id: int, category: str, name: str, glb_url: str, db: Session = Depends(get_db)):
    """Manually add a model (like your Duck) to the DBMS."""
    model = Model(project_id=project_id, category=category, name=name, glb_url=glb_url)
    db.add(model)
    db.commit()
    db.refresh(model)
    return {"model_id": model.id, "msg": "Model registered in DBMS"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)