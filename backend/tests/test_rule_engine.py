from app.services.rule_engine import calculate_risk
from app.models.models import RequirementAnalysis

def test_calculate_risk_high_band():
    mock_analysis = RequirementAnalysis(
        gamp_category="Category 4",
        gamp_rationale="Configured product",
        gxp_impact=True,
        gxp_rationale="Impacts patient safety.",
        severity_fact="Lethal dose possible",
        probability_fact="Likely to occur.",
        detectability_fact="Hard to detect.",
        severity_level="Critical",
        probability_level="High",
        detectability_level="Low"
    )

    result = calculate_risk(mock_analysis)

    assert result["total_risk_score"] == 45
    assert result["risk_band"] == "HIGH"