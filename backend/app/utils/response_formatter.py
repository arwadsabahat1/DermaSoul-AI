def get_confidence_level(score: float) -> str:
    if score >= 0.75:
        return "high"

    if score >= 0.50:
        return "medium"

    return "low"


def round_confidence(score: float) -> float:
    return round(float(score), 4)