# backend/initialize_sample_data.py
from sqlalchemy.orm import Session
from db_engine import SessionLocal, engine
from db_models import Base, Project, Zone, Component, Model
from datetime import datetime

def create_sample_data():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. SAMPLE PROJECTS
        projects_data = [
            Project(name="City Hospital Complex", project_type="Healthcare", regulatory_level="High"),
            Project(name="Oceanview Apartments", project_type="Residential", regulatory_level="Medium"),
            Project(name="Skyline Office Tower", project_type="Commercial", regulatory_level="High")
        ]
        
        for project in projects_data:
            db.merge(project)  # Use merge to avoid duplicates
        
        db.commit()
        
        # 2. SAMPLE ZONES (for project 1 - Hospital)
        zones_data = [
            Zone(project_id=1, zone_name="Structural Core", importance_factor=1.5, inspection_level="Regulatory Critical"),
            Zone(project_id=1, zone_name="Patient Wings", importance_factor=1.2, inspection_level="Enhanced"),
            Zone(project_id=2, zone_name="Residential Towers", importance_factor=1.0, inspection_level="Normal")
        ]
        
        for zone in zones_data:
            db.merge(zone)
        
        db.commit()
        
        # 3. SAMPLE COMPONENTS (for zone 1)
        components_data = [
            Component(zone_id=1, component_type="Load Bearing Wall", load_bearing=True, dependency_count=5, redundancy_level="Medium"),
            Component(zone_id=1, component_type="Steel Beam", load_bearing=True, dependency_count=8, redundancy_level="High"),
            Component(zone_id=2, component_type="Patient Room Partition", load_bearing=False, dependency_count=2, redundancy_level="Low")
        ]
        
        for component in components_data:
            db.merge(component)
        
        db.commit()
        
        # 4. SAMPLE MODELS
        models_data = [
            Model(project_id=1, category="Healthcare", name="Hospital Wing A", glb_url="https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf"),
            Model(project_id=1, category="Healthcare", name="Patient Room", glb_url="https://threejs.org/examples/models/gltf/Soldier.glb"),
            Model(project_id=1, category="Healthcare", name="Operating Theater", glb_url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"),
            Model(project_id=2, category="Residential", name="Apartment Tower A", glb_url="https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf"),
            Model(project_id=3, category="Commercial", name="Office Floor 10", glb_url="https://threejs.org/examples/models/gltf/Soldier.glb")
        ]
        
        for model in models_data:
            db.merge(model)
        
        db.commit()
        
        print("✅ SAMPLE DATA CREATED SUCCESSFULLY!")
        print("\n📋 SUMMARY:")
        print("- 3 Projects (Hospital, Apartments, Office)")
        print("- 3 Zones") 
        print("- 3 Components")
        print("- 5 Models (3 Healthcare, 1 Residential, 1 Commercial)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
