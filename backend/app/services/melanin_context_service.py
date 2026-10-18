from typing import Optional


def build_melanin_context_note(
    skin_tone: Optional[str] = None,
    fitzpatrick_type: Optional[str] = None,
    ethnicity_region: Optional[str] = None,
) -> dict:
    region = ethnicity_region or "your"

    note = (
        f"Skin conditions may appear differently on {region} skin tones. "
        "Redness may be less visible, inflammation may appear darker or brownish, "
        "and post-inflammatory hyperpigmentation may be more noticeable."
    )

    considerations = [
        "Do not rely only on redness; also observe itching, pain, swelling, scaling, texture, and spreading.",
        "Dark marks after acne or irritation may indicate post-inflammatory hyperpigmentation.",
        "Use sunscreen regularly because pigmentation-prone skin can darken after inflammation or sun exposure.",
        "Avoid harsh unverified skin-lightening products, steroid-mixed creams, or unknown products without medical advice.",
    ]

    tone = (skin_tone or "").lower()

    if (
        "brown" in tone
        or "deep" in tone
        or fitzpatrick_type in ["IV", "V", "VI"]
    ):
        considerations.append(
            "On medium-to-deeper skin tones, inflammation may appear purple, grey, brown, or darker rather than bright red."
        )

    return {
        "melanin_context_note": note,
        "skin_tone_considerations": considerations,
    }