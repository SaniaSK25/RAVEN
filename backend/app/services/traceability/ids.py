"""UUID coercion helpers for the traceability layer.

Source-table primary keys are UUIDs, but API path params, impact dicts
and change-event payloads carry them as strings. Coerce at every
boundary so SQLAlchemy's ``Uuid`` bind processor always receives real
``UUID`` objects.
"""

from __future__ import annotations

import uuid as _uuid


def coerce_uuid(value: _uuid.UUID | str) -> _uuid.UUID:
    if isinstance(value, _uuid.UUID):
        return value
    try:
        return _uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError) as exc:
        raise ValueError(f"not a valid UUID: {value!r}") from exc


def coerce_uuids(values) -> list[_uuid.UUID]:
    return [coerce_uuid(v) for v in values or []]
