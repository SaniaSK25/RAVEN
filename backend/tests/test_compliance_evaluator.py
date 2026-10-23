from app.services.compliance_evaluator import evaluate_requirements


def test_evaluate_returns_all_annex_11_mvp_rules():
    result = evaluate_requirements([])

    assert result["framework"] == "EU GMP Annex 11"
    assert result["assessment_type"] == "requirements_only"
    assert len(result["results"]) == 6
    assert result["summary"] == {"COVERED": 0, "PARTIALLY_COVERED": 0, "ABSENT": 6}


def test_matching_is_case_insensitive_and_reports_matched_requirement():
    result = evaluate_requirements([
        {
            "key": "URS-001",
            "text": "The system shall maintain an AUDIT TRAIL for every change, with a reason and periodic review.",
        }
    ])

    audit_trail = next(item for item in result["results"] if item["clause"] == "9")
    assert audit_trail["status"] == "COVERED"
    assert audit_trail["matched_requirement_keys"] == ["URS-001"]
    assert audit_trail["named_gap"] is None


def test_partial_coverage_names_the_missing_control_concepts():
    result = evaluate_requirements([
        {"key": "URS-002", "text": "The system shall provide role-based access and user authentication."}
    ])

    security = next(item for item in result["results"] if item["clause"] == "12")
    assert security["status"] == "PARTIALLY_COVERED"
    assert security["matched_requirement_keys"] == ["URS-002"]
    assert "access review" in security["explanation"]


def test_sample_registration_requirements_do_not_create_false_signature_match():
    requirements = [
        {"key": f"REQ-000{i}", "text": text}
        for i, text in enumerate(
            [
                "The system shall assign a unique sample identifier to each sample registered in the LIMS.",
                "The system shall record the client-provided sample identifier and maintain its association with the LIMS sample identifier.",
                "The system shall associate each sample with the applicable client, project, study, or work order.",
                "The system shall record the sample type and material description during sample registration.",
                "The system shall record the applicable batch, lot, or manufacturing identifier associated with a sample.",
                "The system shall record the date and time when a sample is received by the laboratory.",
                "The system shall record the received sample quantity and applicable unit of measure.",
                "The system shall record the physical condition of a sample at the time of receipt.",
                "The system shall record shipment or delivery information associated with received samples.",
            ],
            start=1,
        )
    ]

    result = evaluate_requirements(requirements)
    signatures = next(item for item in result["results"] if item["clause"] == "14")
    assert signatures["status"] == "ABSENT"
    assert signatures["matched_requirement_keys"] == []
