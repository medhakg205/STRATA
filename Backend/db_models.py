from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Text, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from db_engine import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_type = Column(String, nullable=False)
    regulatory_level = Column(String, nullable=False)
    zones = relationship("Zone", back_populates="project", cascade="all, delete")
    models = relationship("Model", back_populates="project", cascade="all, delete")

class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    category = Column(String, nullable=False)
    name = Column(String, nullable=False)
    glb_url = Column(String, nullable=False)
    glb_data = Column(LargeBinary)  # Store edited GLB binary
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="models")

class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    zone_name = Column(String, nullable=False)
    importance_factor = Column(Float, nullable=False)
    inspection_level = Column(String, nullable=False)
    project = relationship("Project", back_populates="zones")
    components = relationship("Component", back_populates="zone", cascade="all, delete")

class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id", ondelete="CASCADE"))
    component_type = Column(String, nullable=False)
    load_bearing = Column(Boolean, nullable=False)
    dependency_count = Column(Integer, nullable=False)
    redundancy_level = Column(String, nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"))  # Link to edited model
    zone = relationship("Zone", back_populates="components")
    decisions = relationship("Decision", back_populates="component", cascade="all, delete")

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"))
    decision_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    mitigation_flag = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    component = relationship("Component", back_populates="decisions")
    risk_event = relationship("RiskEvent", back_populates="decision", uselist=False, cascade="all, delete")

class RiskEvent(Base):
    __tablename__ = "risk_events"
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"))
    xgboost_score = Column(Float, nullable=False)  # XGBoost score
    risk_category = Column(String, nullable=False)
    threshold_action = Column(String)  # "blockchain" or "merkle"
    decision = relationship("Decision", back_populates="risk_event")
