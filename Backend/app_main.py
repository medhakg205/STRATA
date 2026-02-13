from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from db_engine import SessionLocal, initialize_database
from db_models import Project, Zone, Component, Decision, RiskEvent
from risk_logic import generate_risk_event

from datetime import datetime


app = FastAPI(title="Strata-Sentinel Enterprise")

# Initialize DB tables
initialize_database()

# ----------------------------
# CORS
# ----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# DB Dependency
# ----------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================
# PROJECT
# ==========================================================

@app.post("/create_project/")
def create_project(name: str, project_type: str, regulatory_level: float, db: Session = Depends(get_db)):

    new_project = Project(
        name=name,
        project_type=project_type,
        regulatory_level=regulatory_level
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return {
        "project_id": new_project.id,
        "message": "Project created successfully"
    }


# ==========================================================
# ZONE
# ==========================================================

@app.post("/create_zone/")
def create_zone(project_id: int, zone_name: str,
                importance_factor: float,
                inspection_level: float,
                db: Session = Depends(get_db)):

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_zone = Zone(
        project_id=project_id,
        zone_name=zone_name,
        importance_factor=importance_factor,
        inspection_level=inspection_level
    )

    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)

    return {
        "zone_id": new_zone.id,
        "message": "Zone created successfully"
    }


# ==========================================================
# COMPONENT
# ==========================================================

@app.post("/create_component/")
def create_component(zone_id: int,
                     component_type: str,
                     load_bearing: bool,
                     dependency_count: int,
                     redundancy_level: float,
                     db: Session = Depends(get_db)):

    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    new_component = Component(
        zone_id=zone_id,
        component_type=component_type,
        load_bearing=load_bearing,
        dependency_count=dependency_count,
        redundancy_level=redundancy_level
    )

    db.add(new_component)
    db.commit()
    db.refresh(new_component)

    return {
        "component_id": new_component.id,
        "message": "Component created successfully"
    }


# ==========================================================
# RECORD DECISION (AI TRIGGER + RISK EVENT)
# ==========================================================

@app.post("/record_decision/{component_id}")
def record_decision(component_id: int,
                    decision_type: str,
                    mitigation_flag: bool,
                    db: Session = Depends(get_db)):

    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    zone = db.query(Zone).filter(Zone.id == component.zone_id).first()
    project = db.query(Project).filter(Project.id == zone.project_id).first()

    # ----------------------------
    # AI RISK ENGINE
    # ----------------------------

    regulatory_level = float(project.regulatory_level)
    importance_factor = float(zone.importance_factor)
    inspection_level = float(zone.inspection_level)
    redundancy_level = float(component.redundancy_level)
    
    risk_data = generate_risk_event(
        regulatory_level=project.regulatory_level,
        importance_factor=zone.importance_factor,
        load_bearing=component.load_bearing,
        dependency_count=component.dependency_count,
        redundancy_level=component.redundancy_level,
        mitigation_flag=mitigation_flag
    )

    base_risk = risk_data["base_risk"]
    adjusted_risk = risk_data["adjusted_risk"]
    final_score = risk_data["final_score"]
    severity = risk_data["severity"]

    # ----------------------------
    # CREATE DECISION
    # ----------------------------

    new_decision = Decision(
        component_id=component_id,
        decision_type=decision_type,
        severity=severity,
        mitigation_flag=mitigation_flag,
        timestamp=datetime.utcnow()
    )

    db.add(new_decision)
    db.flush()  # get ID without committing

    # ----------------------------
    # CREATE RISK EVENT
    # ----------------------------

    new_risk_event = RiskEvent(
        decision_id=new_decision.id,
        base_risk=base_risk,
        adjusted_risk=adjusted_risk,
        final_score=final_score
    )

    db.add(new_risk_event)
    db.commit()

    # Governance stub (blockchain ready)
    blockchain_stub = f"SS-{new_decision.id}-{severity}-{final_score}"

    return {
        "decision_id": new_decision.id,
        "severity": severity,
        "final_score": final_score,
        "blockchain_hash_stub": blockchain_stub
    }
