"""Read/write roadmap and releases CSV (shared with render.py)."""

import csv
from pathlib import Path

import pandas as pd

from render import load_releases, load_roadmap

ROADMAP_COLUMNS = [
    "domain",
    "feature",
    "task",
    "start_date",
    "end_date",
    "notes",
    "flag",
    "flag_label",
]
RELEASE_COLUMNS = ["release", "start_date", "end_date"]


def roadmap_to_records(df: pd.DataFrame) -> list[dict]:
    out = []
    for _, row in df.iterrows():
        out.append({
            "domain": str(row.get("domain", "") or ""),
            "feature": str(row.get("feature", row.get("row_feature", "")) or ""),
            "task": str(row.get("task", row.get("task_label", "")) or ""),
            "start_date": _date_str(row.get("start")),
            "end_date": _date_str(row.get("end")),
            "notes": _safe_cell(row.get("notes")),
            "flag": _safe_cell(row.get("flag")),
            "flag_label": _safe_cell(row.get("flag_label")),
        })
    return out


def _safe_cell(val) -> str:
    if val is None:
        return ""
    try:
        if pd.isna(val):
            return ""
    except (TypeError, ValueError):
        pass
    s = str(val).strip()
    return "" if s.lower() in ("nan", "none", "<na>") else s


def _date_str(d) -> str:
    if d is None or (hasattr(d, "year") and pd.isna(d)):
        return ""
    if hasattr(d, "strftime"):
        return d.strftime("%Y-%m-%d")
    return str(d)[:10]


def save_roadmap_csv(path: Path, records: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=ROADMAP_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in records:
            row = {k: (r.get(k) or "") for k in ROADMAP_COLUMNS}
            w.writerow(row)


def save_releases_csv(path: Path, records: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=RELEASE_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in records:
            w.writerow({k: (r.get(k) or "") for k in RELEASE_COLUMNS})


def load_roadmap_records(path: Path) -> list[dict]:
    return roadmap_to_records(load_roadmap(path))


def load_release_records(path: Path) -> list[dict]:
    df = load_releases(path)
    return [
        {
            "release": str(row.get("release", "")),
            "start_date": _date_str(row.get("start")),
            "end_date": _date_str(row.get("end")),
        }
        for _, row in df.iterrows()
    ]
