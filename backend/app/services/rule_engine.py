from app.models.models import RequirementAnalysis

def calculate_risk(analysis: RequirementAnalysis) -> dict:
    severity_map = {"Low": 1, "Medium": 2, "High": 4, "Critical": 5}
    probability_map = {"Low": 1, "Medium": 2, "High": 3}
    detectability_map = {"High": 1, "Medium": 2, "Low": 3}

    sev_score = severity_map[analysis.severity_level]
    prob_score = probability_map[analysis.probability_level]
    det_score = detectability_map[analysis.detectability_level]

    total_score = sev_score * prob_score * det_score

    if total_score >= 16:
        risk_band = "HIGH"
    elif total_score >= 8:
        risk_band = "MEDIUM"
    else:
        risk_band = "LOW"
    
    return {
        "severity_score": sev_score,
        "probability_score": prob_score,
        "detectability_score": det_score,
        "total_risk_score": total_score,
        "risk_band": risk_band
    }