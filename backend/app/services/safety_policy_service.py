from __future__ import annotations

from typing import Any


def enforce_safety_policy(
    *,
    llm_payload: dict[str, Any],
    risk_level: str,
    red_flags: list[str],
    doctor_warning: str,
) -> dict[str, Any]:
    result = dict(llm_payload)
    normalized = (risk_level or "").strip().lower()
    if normalized == "high" or red_flags:
        existing_steps = result.get("next_steps", [])
        next_steps = list(existing_steps) if isinstance(existing_steps, list) else []
        emergency_step = (
            "Urgent in-person medical evaluation is recommended due to high-risk indicators."
        )
        if emergency_step not in next_steps:
            next_steps.insert(0, emergency_step)
        result["next_steps"] = next_steps
        result["safety_escalation_enforced"] = True
        result["doctor_warning"] = doctor_warning
    else:
        result["safety_escalation_enforced"] = False
    return result
