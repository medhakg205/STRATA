def compute_risk(building_type,
                 component_type,
                 span_length,
                 cost_impact,
                 delay_days,
                 dependency_count,
                 redundancy_level,
                 inspection_level,
                 mitigation_action):

    # ---------------------------
    # 1️⃣ Base Risk (normalized 0–1)
    # ---------------------------
    base_risk = min(
        (span_length * 0.01) +
        (cost_impact / 100000) +
        (delay_days * 0.02),
        1.0
    )

    # ---------------------------
    # 2️⃣ Importance Factor
    # ---------------------------
    importance_factors = {
        "Storage": 0.8,
        "Residential": 1.0,
        "Commercial": 1.1,
        "School": 1.25,
        "Healthcare": 1.5,
        "Megacomplex": 1.3
    }

    importance = importance_factors.get(building_type, 1.0)

    # ---------------------------
    # 3️⃣ Dependency Multiplier
    # ---------------------------
    dependency_multiplier = min(1 + (0.05 * dependency_count), 1.4)

    # ---------------------------
    # 4️⃣ Redundancy Multiplier
    # ---------------------------
    redundancy_map = {
        "High": 0.85,
        "Medium": 1.0,
        "Low": 1.2
    }

    redundancy_multiplier = redundancy_map.get(redundancy_level, 1.0)

    # ---------------------------
    # 5️⃣ Inspection Multiplier
    # ---------------------------
    inspection_map = {
        "Normal": 1.0,
        "Enhanced": 1.15,
        "Regulatory Critical": 1.3
    }

    inspection_multiplier = inspection_map.get(inspection_level, 1.0)

    # ---------------------------
    # 6️⃣ Mitigation Multiplier
    # ---------------------------
    mitigation_map = {
        "None": 1.0,
        "Added Inspection": 0.9,
        "Reinforcement Added": 0.8,
        "Material Upgrade": 0.75,
        "Structural Strengthening": 0.7
    }

    mitigation_multiplier = mitigation_map.get(mitigation_action, 1.0)

    # ---------------------------
    # Final Risk
    # ---------------------------
    final_risk = (
        base_risk *
        importance *
        dependency_multiplier *
        redundancy_multiplier *
        inspection_multiplier *
        mitigation_multiplier
    )

    # ---------------------------
    # Risk Classification
    # ---------------------------
    if final_risk < 0.5:
        category = "Low"
    elif final_risk < 1.0:
        category = "Medium"
    elif final_risk < 1.5:
        category = "High"
    else:
        category = "Critical"

    # ---------------------------
    # Confidence Score (NEW)
    # Higher dependencies + higher inspection = higher confidence
    # ---------------------------
    confidence = min(
        0.6 +
        (dependency_count * 0.02) +
        (0.1 if inspection_level != "Normal" else 0),
        0.95
    )

    explanation = (
        f"BaseRisk={round(base_risk,2)} | "
        f"I={importance} | "
        f"D={dependency_multiplier} | "
        f"R={redundancy_multiplier} | "
        f"Inspect={inspection_multiplier} | "
        f"Mitigation={mitigation_multiplier}"
    )

    return round(final_risk, 2), category, explanation, round(confidence, 2)
