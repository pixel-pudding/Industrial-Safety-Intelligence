"""
Baseline mode: random-walk generation and tier classification per Step 4.

"Baseline mode (random-walk within Normal range per tag, so the dashboard
never looks frozen)" — Part II. Scenario mode overrides these values;
baseline resumes for any tag a scenario isn't actively driving.
"""

from __future__ import annotations

import random

from app.models import SensorTag

SPECIAL_BASELINE = {
    "N2-PURGE": "completed",
    "FLARE-FLOW": "baseline",
}

SPECIAL_TIER = {
    "N2-PURGE": {"completed": "normal", "delayed": "warning", "skipped": "critical", "failed": "critical"},
    "FLARE-FLOW": {"baseline": "normal", "elevated": "warning", "sustained_high": "critical"},
}


def initial_value(tag: SensorTag) -> float | str:
    if tag.direction == "binary":
        return "Pass"
    if tag.direction == "special":
        if tag.tag == "LOAD-FLOW":
            return round(random.uniform(tag.normal_low, tag.normal_high), 1)
        return SPECIAL_BASELINE[tag.tag]
    if tag.tag == "CAT-AGE":
        return round(random.uniform(0, 30), 1)  # fresh-ish catalyst at sim start
    return round(random.uniform(tag.normal_low, tag.normal_high), 2)


def step_baseline(tag: SensorTag, prev_value: float | str) -> float | str:
    """One tick of baseline random-walk. Never drifts outside Normal range by design."""
    if tag.direction == "binary":
        return "Pass"
    if tag.direction == "special":
        if tag.tag == "LOAD-FLOW":
            sigma = (tag.normal_high - tag.normal_low) * 0.08
            new_val = float(prev_value) + random.gauss(0, sigma)
            return round(min(max(new_val, tag.normal_low), tag.normal_high), 1)
        return SPECIAL_BASELINE[tag.tag]
    if tag.tag == "CAT-AGE":
        return round(float(prev_value) + random.uniform(0.05, 0.15), 2)  # simulated days passing

    sigma = (tag.normal_high - tag.normal_low) * 0.04
    new_val = float(prev_value) + random.gauss(0, sigma)
    return round(min(max(new_val, tag.normal_low), tag.normal_high), 2)


def classify_tier(tag: SensorTag, value: float | str) -> str:
    if tag.direction == "binary":
        return "normal" if value == "Pass" else "critical"

    if tag.direction == "special":
        if tag.tag == "LOAD-FLOW":
            v = float(value)
            if v <= 1:
                return "critical"  # sudden drop to ~0
            if v < tag.normal_low * 0.5:
                return "warning"  # erratic / well below normal band
            return "normal"
        return SPECIAL_TIER[tag.tag].get(str(value), "normal")

    v = float(value)
    if tag.direction == "higher_is_worse":
        if v <= tag.normal_high:
            return "normal"
        if v <= tag.warning_high:
            return "warning"
        return "critical"

    if tag.direction == "lower_is_worse":
        if v >= tag.normal_low:
            return "normal"
        if v >= tag.warning_low:
            return "warning"
        return "critical"

    raise ValueError(f"Unknown direction {tag.direction!r} for tag {tag.tag}")
