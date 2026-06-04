"""Per-domain current state (admin UI), stored separately from roadmap.csv."""

from __future__ import annotations

import json
import shutil
from pathlib import Path


def ensure_draft_meta_from_live(live: Path, draft: Path) -> None:
    if draft.exists():
        return
    if live.exists():
        shutil.copy2(live, draft)
    else:
        draft.parent.mkdir(parents=True, exist_ok=True)
        draft.write_text("{}", encoding="utf-8")


def load_domain_meta(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(raw, dict):
        return {}
    out: dict[str, str] = {}
    for k, v in raw.items():
        key = str(k).strip()
        if not key:
            continue
        text = "" if v is None else str(v).strip()
        if text.lower() in ("nan", "none"):
            text = ""
        out[key] = text
    return out


def save_domain_meta(path: Path, meta: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cleaned = {
        str(k).strip(): str(v).strip()
        for k, v in meta.items()
        if str(k).strip() and str(v).strip()
    }
    path.write_text(json.dumps(cleaned, indent=2), encoding="utf-8")


def publish_meta(draft: Path, live: Path) -> None:
    if draft.exists():
        shutil.copy2(draft, live)
    elif live.exists():
        live.unlink(missing_ok=True)
