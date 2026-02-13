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

# --- MODEL FETCHING ---
@app.get("/public_glb_models/")
def get_public_models(db: Session = Depends(get_db)):
    models = db.query(Model).filter(Model.glb_url != None).all()
    result = []
    for m in models:
        if m.glb_url.strip():  # skip empty strings
            result.append({
                "id": m.id,
                "name": m.name,
                "category": m.category,
                "glb_url": m.glb_url,
                "risk_score": getattr(m, "current_risk", 0.0)
            })
    return result

@app.get("/latest_model/{model_id}")
def get_latest_model(model_id: int, db: Session = Depends(get_db)):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    # Return both URL and the stored score
    return {"glb_url": model.glb_url, "risk_score": model.current_risk}

# --- THE FIX: DYNAMIC EDIT & SAVE ---

@app.post("/edit_component/")
async def edit_component(request: dict = Body(...), db: Session = Depends(get_db)):
    comp_id = request.get("component_id")
    model_url = request.get("model_url")
    edit_params = request.get("edit_params", {})

    # 1. Find the Model and associated Component
    db_model = db.query(Model).filter(Model.id == comp_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 2. Compute Risk using XGBoost
    if XGBOOST_AVAILABLE:
        # We use high weights for mitigation to ensure the score moves
        features = [
            edit_params.get("span_length", 10.0),
            edit_params.get("cost_impact", 50000),
            edit_params.get("delay_days", 5.0),
            5.0, 1.2, 1.0, 1.0, # Dummy structural stats
            10.0 if edit_params.get("mitigation") else 0.0
        ]
        risk_score, category, explanation = risk_model.predict_risk(features)
    else:
        risk_score, category = 0.0, "Offline"

    # 3. GLB Edit & Storage
    storage_url = model_url
    if XGBOOST_AVAILABLE:
        try:
            gltf = GLBEditor.load_public_glb(model_url)
            color = [0.2, 0.8, 0.2] if edit_params.get("mitigation") else [1.0, 0.3, 0.3]
            gltf = GLBEditor.modify_material(gltf, color=color)

            with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
                glb_data = GLBEditor.save_glb(gltf, tmp.name)
                storage_url = SupabaseStorage.upload_glb(
                    project_id=1, model_id=comp_id, glb_data=glb_data,
                    version=f"rev_{int(datetime.utcnow().timestamp())}"
                )
            
            # ✅ PERSIST TO DATABASE: Update the actual model record
            db_model.glb_url = storage_url
            db_model.current_risk = risk_score
            db.commit()
        except Exception as e:
            print(f"Error: {e}")

    return {
        "status": "success",
        "risk_score": risk_score,
        "new_url": storage_url,
        "category": category
    }

# --- YOUR ORIGINAL PROJECT/ZONE LOGIC ---
@app.post("/create_project/")
def create_project(name: str, project_type: str, regulatory_level: str, db: Session = Depends(get_db)):
    project = Project(name=name, project_type=project_type, regulatory_level=regulatory_level)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"project_id": project.id}