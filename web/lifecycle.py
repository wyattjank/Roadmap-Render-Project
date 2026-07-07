"""Software lifecycle inventory — platform components, versions, and EOL dates."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

VALID_STATUSES = frozenset({"active", "eol", "planned", "deprecated"})


def ensure_draft_from_live(live: Path, draft: Path) -> None:
    if draft.exists():
        return
    if live.exists():
        shutil.copy2(live, draft)
    else:
        draft.parent.mkdir(parents=True, exist_ok=True)
        draft.write_text("[]", encoding="utf-8")


def publish_draft_to_live(draft: Path, live: Path) -> None:
    shutil.copy2(draft, live)


def load_lifecycle(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    if not isinstance(raw, list):
        return []
    return [_normalize_entry(e, i) for i, e in enumerate(raw) if isinstance(e, dict)]


def _normalize_entry(raw: dict, index: int) -> dict:
    software = str(raw.get("software", "")).strip()
    version = str(raw.get("version", "")).strip()
    status = str(raw.get("status", "active")).strip().lower()
    if status not in VALID_STATUSES:
        status = "active"
    entry_id = str(raw.get("id", "")).strip()
    if not entry_id:
        slug = f"{software}-{version}".lower().replace(" ", "-")
        entry_id = slug or f"item-{index}"
    return {
        "id": entry_id,
        "software": software,
        "version": version,
        "status": status,
        "eol_date": _clean_date(raw.get("eol_date")),
        "active_until": _clean_date(raw.get("active_until")),
        "notes": str(raw.get("notes", "")).strip(),
    }


def _clean_date(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in ("nan", "none", "null"):
        return None
    return text


def save_lifecycle(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cleaned = [_normalize_entry(e, i) for i, e in enumerate(entries) if isinstance(e, dict)]
    cleaned = [e for e in cleaned if e["software"]]
    path.write_text(json.dumps(cleaned, indent=2), encoding="utf-8")
