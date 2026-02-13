from datetime import datetime
import math  # For isnan check

def generate_risk_event(
    regulatory_level: float = 0.0,
    importance_factor: float = 0.0,
    load_bearing: bool = False,
    dependency_count: int = 0,
    redundancy_level: float = 0.0,
    mitigation_flag: bool = False
):
    
    # 🔧 Input validation - prevents NaN
    def safe_float(val, default=0.0):
        if val is None or math.isnan(val):
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default
    
    def safe_int(val, default=0):
        if val is None:
            return default
        try:
            return int(val)
        except (ValueError, TypeError):
            return default
        
    def safe_bool(val, default=False):
        if val is None:
            return default
        return bool(val)

    regulatory_level = safe_float(regulatory_level)
    importance_factor = safe_float(importance_factor)
    load_bearing = safe_bool(load_bearing)
    dependency_count = safe_int(dependency_count)
    redundancy_level = safe_float(redundancy_level, 0.0)
    mitigation_flag = safe_bool(mitigation_flag)

    # ---------------------------------------------------------
    # 1️⃣ Base Risk
    # ---------------------------------------------------------

    base_risk = 1.0

    # Regulatory scaling
    base_risk *= (1 + regulatory_level * 0.1)

    # Load-bearing multiplier
    if load_bearing:
        base_risk *= 1.3

    # Dependency impact
    base_risk *= (1 + dependency_count * 0.05)

    base_risk = round(base_risk, 4)

    # ---------------------------------------------------------
    # 2️⃣ Zone Adjustment
    # ---------------------------------------------------------

    adjusted_risk = base_risk * (1 + importance_factor * 0.1)
    adjusted_risk = round(adjusted_risk, 4)

    # ---------------------------------------------------------
    # 3️⃣ Redundancy Modifier
    # ---------------------------------------------------------

    # Higher redundancy lowers risk
    redundancy_modifier = max(0.5, 1 - (redundancy_level * 0.1))
    final_score = adjusted_risk * redundancy_modifier

    # ---------------------------------------------------------
    # 4️⃣ Mitigation Adjustment
    # ---------------------------------------------------------

    if mitigation_flag:
        final_score *= 0.85

    final_score = round(final_score, 4)

    # ---------------------------------------------------------
    # 5️⃣ Severity Classification
    # ---------------------------------------------------------

    if final_score < 1.2:
        severity = "Low"
    elif final_score < 1.8:
        severity = "Moderate"
    elif final_score < 2.5:
        severity = "High"
    else:
        severity = "Critical"

    # ---------------------------------------------------------
    # Return Structured Risk Object
    # ---------------------------------------------------------

    return {
        "base_risk": base_risk,
        "adjusted_risk": adjusted_risk,
        "final_score": final_score,
        "severity": severity,
        "generated_at": datetime.utcnow()
    }
