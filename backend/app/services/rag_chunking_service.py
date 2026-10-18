from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Chunk:
    chunk_index: int
    content: str


def chunk_text(text: str, *, chunk_size: int = 900, overlap: int = 120) -> list[Chunk]:
    if not text:
        return []
    normalized = " ".join(text.split())
    if len(normalized) <= chunk_size:
        return [Chunk(chunk_index=0, content=normalized)]

    chunks: list[Chunk] = []
    start = 0
    idx = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        segment = normalized[start:end].strip()
        if segment:
            chunks.append(Chunk(chunk_index=idx, content=segment))
            idx += 1
        if end >= len(normalized):
            break
        start = max(0, end - overlap)
    return chunks
