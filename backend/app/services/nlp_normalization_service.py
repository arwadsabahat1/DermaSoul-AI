from __future__ import annotations

from typing import Iterable


CANONICAL_ENTITY_MAP: dict[str, str] = {
    "itch": "itching",
    "itchy": "itching",
    "itching": "itching",
    "rash": "rash",
    "rashes": "rash",
    "redness": "redness",
    "red": "redness",
    "burning": "burning",
    "pain": "pain",
    "swelling": "swelling",
    "swollen": "swelling",
    "blister": "blister",
    "blisters": "blister",
    "scaly": "scaling",
    "scaling": "scaling",
    "flaky": "flaking",
    "flake": "flaking",
    "flaking": "flaking",
    "bump": "bumps",
    "bumps": "bumps",
    "dry": "dryness",
    # Roman-Urdu / Hindi
    "khujli": "itching",
    "kharish": "itching",
    "jalan": "burning",
    "dard": "pain",
    "soojan": "swelling",
    "sujan": "swelling",
    "daane": "rash",
    "khushk": "dryness",
    "laal": "redness",
    "bleeding": "bleeding",
    "pus": "pus_or_discharge",
    "oozing": "pus_or_discharge",
    "discharge": "pus_or_discharge",
    "peeling": "skin_peeling",
    "dryness": "dryness",
    "acne": "acne_or_pimples",
    "pimple": "acne_or_pimples",
    "pimples": "acne_or_pimples",
}


def normalize_token(token: str | None) -> str:
    if not token:
        return ""
    return token.strip().lower()


def canonicalize_entity(text: str) -> str:
    normalized = normalize_token(text)
    if not normalized:
        return ""
    return CANONICAL_ENTITY_MAP.get(normalized, normalized.replace(" ", "_"))


def deduplicate_canonical(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = canonicalize_entity(value)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(key)
    return result
