import time
import uuid
from collections.abc import Callable
from typing import Any

import structlog

logger: structlog.stdlib.BoundLogger = structlog.get_logger()


def generate_request_id() -> str:
    return str(uuid.uuid4())


def log_request_middleware(request_id: str, method: str, path: str) -> dict[str, Any]:
    return {"request_id": request_id, "method": method, "path": path}


class RequestTimer:
    def __init__(self, request_id: str, requirement_id: str | None = None):
        self.request_id = request_id
        self.requirement_id = requirement_id
        self.start_time: float = 0.0

    def __enter__(self) -> "RequestTimer":
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        duration = (time.perf_counter() - self.start_time) * 1000
        log_data: dict[str, Any] = {
            "request_id": self.request_id,
            "duration_ms": round(duration, 2),
        }
        if self.requirement_id:
            log_data["requirement_id"] = self.requirement_id

        if exc_type is not None:
            logger.error("request_failed", **log_data, error=str(exc_val))
        else:
            logger.info("request_completed", **log_data)
