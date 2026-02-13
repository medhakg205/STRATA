from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db_engine import Base


# ---------------------------------------------------
# PROJECTS TABLE
# ---------------------------------------------------

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_type = Column(String, nullable=False)
    regulatory_level = Column(String, nullable=False)

    zones = relationship("Zone", back_populates="project", cascade="all, delete")


# ---------------------------------------------------
# ZONES TABLE
# ---------------------------------------------------

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))

    zone_name = Column(String, nullable=False)
    importance_factor = Column(Float, nullable=False)
    inspection_level = Column(String, nullable=False)

    project = relationship("Project", back_populates="zones")
    components = relationship("Component", back_populates="zone", cascade="all, delete")


# ---------------------------------------------------
# COMPONENTS TABLE
# ---------------------------------------------------

class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id", ondelete="CASCADE"))

    component_type = Column(String, nullable=False)
    load_bearing = Column(Boolean, nullable=False)
    dependency_count = Column(Integer, nullable=False)
    redundancy_level = Column(String, nullable=False)

    zone = relationship("Zone", back_populates="components")
    decisions = relationship("Decision", back_populates="component", cascade="all, delete")


# ---------------------------------------------------
# DECISIONS TABLE
# ---------------------------------------------------

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"))

    decision_type = Column(String, nullable=False)       # Accept / Reject / Modify
    severity = Column(String, nullable=False)            # Low / Medium / High / Critical
    mitigation_flag = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    component = relationship("Component", back_populates="decisions")
    risk_event = relationship("RiskEvent", back_populates="decision", uselist=False, cascade="all, delete")


# ---------------------------------------------------
# RISK EVENTS TABLE
# ---------------------------------------------------

class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"))

    base_risk = Column(Float, nullable=False)
    adjusted_risk = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)

    decision = relationship("Decision", back_populates="risk_event")
