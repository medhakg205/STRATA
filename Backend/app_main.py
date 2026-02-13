from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from db_engine import SessionLocal, initialize_database
from db_models import Project, Zone, Component, Decision, RiskEvent
from risk_logic import compute_risk


app = FastAPI(title="Strata-Sentinel Enterprise")

initialize_database()


# ---------------------------------------------------
# CORS
# ---------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------
# DATABASE SESSION
# ---------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------
# CREATE PROJECT
# ---------------------------------------------------

@app.post("/create_project/")
def create_project(name: str, project_type: str, regulatory_level: str, db: Session = Depends(get_db)):

    project = Project(
        name=name,
        project_type=project_type,
        regulatory_level=regulatory_level
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {"project_id": project.id}


# ---------------------------------------------------
# CREATE ZONE
# ---------------------------------------------------

@app.post("/create_zone/")
def create_zone(project_id: int, zone_name: str,
                importance_factor: float,
                inspection_level: str,
                db: Session = Depends(get_db)):

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    zone = Zone(
        project_id=project_id,
        zone_name=zone_name,
        importance_factor=importance_factor,
        inspection_level=inspection_level
    )

    db.add(zone)
    db.commit()
    db.refresh(zone)

    return {"zone_id": zone.id}


# ---------------------------------------------------
# CREATE COMPONENT
# ---------------------------------------------------

@app.post("/create_component/")
def create_component(zone_id: int,
                     component_type: str,
                     load_bearing: bool,
                     dependency_count: int,
                     redundancy_level: str,
                     db: Session = Depends(get_db)):

    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    component = Component(
        zone_id=zone_id,
        component_type=component_type,
        load_bearing=load_bearing,
        dependency_count=dependency_count,
        redundancy_level=redundancy_level
    )

    db.add(component)
    db.commit()
    db.refresh(component)

    return {"component_id": component.id}


# ---------------------------------------------------
# RECORD DECISION (AI TRIGGER)
# ---------------------------------------------------

@app.post("/record_decision/")
def record_decision(component_id: int,
                    decision_type: str,
                    mitigation_flag: bool,
                    db: Session = Depends(get_db)):

    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    zone = db.query(Zone).filter(Zone.id == component.zone_id).first()
    project = db.query(Project).filter(Project.id == zone.project_id).first()

    # -----------------------
    # AI Risk Computation
    # -----------------------

    base_risk, category, explanation, confidence = compute_risk(
        building_type=project.project_type,
        component_type=component.component_type,
        span_length=10,
        cost_impact=50000,
        delay_days=5,
        dependency_count=component.dependency_count,
        redundancy_level=component.redundancy_level,
        inspection_level=zone.inspection_level,
        mitigation_action="Structural Strengthening" if mitigation_flag else "None"
    )

    adjusted_risk = base_risk * zone.importance_factor
    final_score = adjusted_risk

    # -----------------------
    # Store Decision
    # -----------------------

    decision = Decision(
        component_id=component_id,
        decision_type=decision_type,
        severity=category,
        mitigation_flag=mitigation_flag,
        timestamp=datetime.utcnow()
    )

    db.add(decision)
    db.commit()
    db.refresh(decision)

    # -----------------------
    # Store Risk Event
    # -----------------------

    risk_event = RiskEvent(
        decision_id=decision.id,
        base_risk=base_risk,
        adjusted_risk=adjusted_risk,
        final_score=final_score
    )

    db.add(risk_event)
    db.commit()

    blockchain_stub = f"SS-{decision.id}-{category}-{round(final_score,2)}"

    warning = None
    if category in ["High", "Critical"]:
        warning = "⚠ Governance escalation required"

    return {
        "decision_id": decision.id,
        "risk_category": category,
        "final_score": round(final_score, 2),
        "confidence": confidence,
        "blockchain_hash_stub": blockchain_stub,
        "warning": warning
    }
