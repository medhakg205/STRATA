from pydantic import BaseModel


class BuildingInput(BaseModel):
    name: str
    building_type: str   # Healthcare / Residential / Megacomplex

class ComponentInput(BaseModel):
    building_id: int
    component_type: str
    material: str
    span_length: float
    cost_impact: float
    delay_days: float

    dependency_count: int
    redundancy_level: str   # High / Medium / Low
    inspection_level: str   # Normal / Enhanced / Regulatory Critical
    mitigation_action: str  # None / Added Inspection / Reinforcement Added / etc
