from datetime import datetime


# ---------------------------------------------------------
# CORE ENTERPRISE RISK ENGINE
# ---------------------------------------------------------

def generate_risk_event(
    regulatory_level: float,
    importance_factor: float,
    load_bearing: bool,
    dependency_count: int,
    redundancy_level: float,
    mitigation_flag: bool
):
    """
    Enterprise risk calculation engine.

    Parameters:
    - regulatory_level (float)      -> Project-level risk multiplier
    - importance_factor (float)     -> Zone criticality factor
    - load_bearing (bool)           -> Structural importance
    - dependency_count (int)        -> System coupling
    - redundancy_level (float)      -> Resilience factor
    - mitigation_flag (bool)        -> Active mitigation present

    Returns:
    - dict with base_risk, adjusted_risk, final_score, severity
    """

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
