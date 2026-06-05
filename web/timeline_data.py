"""Build timeline JSON for the admin UI (same ordering/colors as Excel/draw.io)."""

from datetime import date, datetime

import pandas as pd

from render import (
    X_END,
    X_START,
    _feature_color_map,
    _month_range,
    _prepare_roadmap,
    _roadmap_by_domain_feature,
)


def _iso(d) -> str | None:
    if d is None or (hasattr(d, "year") and pd.isna(d)):
        return None
    if hasattr(d, "strftime"):
        return d.strftime("%Y-%m-%d")
    return str(d)[:10]


def _safe_str(val) -> str:
    if val is None:
        return ""
    try:
        if pd.isna(val):
            return ""
    except (TypeError, ValueError):
        pass
    s = str(val).strip()
    return "" if s.lower() in ("nan", "none", "<na>") else s


def build_timeline_payload(roadmap, releases) -> dict:
    """Serializable timeline for the web UI."""
    months = [{"date": m.strftime("%Y-%m-%d"), "label": label} for m, label in _month_range(X_START, X_END)]
    feature_colors = _feature_color_map(roadmap)

    release_rows = []
    for _, row in releases.iterrows():
        release_rows.append({
            "release": str(row.get("release", "")),
            "start": _iso(row.get("start")),
            "end": _iso(row.get("end")),
        })

    tasks = []
    idx = 0
    for domain_name, feature_name, task_list in _roadmap_by_domain_feature(roadmap):
        color = feature_colors.get((domain_name, feature_name), "#cccccc")
        for r in task_list:
            tasks.append({
                "id": idx,
                "domain": domain_name,
                "feature": feature_name,
                "task": _safe_str(r.get("task_label", "")),
                "start": _iso(r.get("start")),
                "end": _iso(r.get("end")),
                "notes": _safe_str(r.get("notes")),
                "flag": _safe_str(r.get("flag")),
                "flag_label": _safe_str(r.get("flag_label")),
                "flag_color": _safe_str(r.get("flag_color")),
                "color": color,
            })
            idx += 1

    x_min = datetime.strptime(X_START, "%Y-%m-%d")
    x_max = datetime.strptime(X_END, "%Y-%m-%d")
    total_days = (x_max - x_min).days or 1

    return {
        "x_start": X_START,
        "x_end": X_END,
        "total_days": total_days,
        "today": date.today().isoformat(),
        "months": months,
        "releases": release_rows,
        "tasks": tasks,
    }
