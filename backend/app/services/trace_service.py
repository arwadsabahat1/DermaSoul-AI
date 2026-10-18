from __future__ import annotations

import logging
import uuid
from typing import Any

logger = logging.getLogger("ai-trace")


def new_trace_id() -> str:
    return str(uuid.uuid4())


def log_trace_event(trace_id: str, event: str, payload: dict[str, Any] | None = None) -> None:
    logger.info("trace_id=%s event=%s payload=%s", trace_id, event, payload or {})
