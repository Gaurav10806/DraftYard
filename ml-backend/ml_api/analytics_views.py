"""
TASK 2 — Insights / Analytics Django APIs.

Reads burial data straight from MongoDB (pymongo) and aggregates it with
pandas. Mem A's insights dashboard consumes these directly.
"""
from collections import Counter

import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .mongo_utils import get_burials_collection

# Normalize every timeSpent value to months so "average time invested"
# is comparable across domains regardless of whether it was logged in
# days, weeks, or months.
_UNIT_TO_MONTHS = {
    "days": 1 / 30,
    "weeks": 1 / 4.345,
    "months": 1,
}


def _load_burials_df():
    """Pulls all burial docs into a flat pandas DataFrame for aggregation."""
    docs = list(get_burials_collection().find({}))
    if not docs:
        return pd.DataFrame()

    rows = []
    for d in docs:
        time_spent = d.get("timeSpent") or {}
        value = time_spent.get("value")
        unit = time_spent.get("unit")
        months = (
            round(value * _UNIT_TO_MONTHS.get(unit, 1), 3)
            if value is not None and unit in _UNIT_TO_MONTHS
            else None
        )
        rows.append({
            "domain": d.get("domain"),
            "techStack": d.get("techStack") or [],
            "teamSize": d.get("teamSize"),
            "stageDied": d.get("stageDied"),
            "deathCategory": d.get("deathCategory"),
            "timeSpentMonths": months,
        })
    return pd.DataFrame(rows)


@api_view(["GET"])
def failure_patterns(request):
    """GET /api/ml/analytics/failure-patterns/
    Count of shelved projects per failure/death category.
    e.g. { "Scope Creep Syndrome": 12, "Solo Founder Burnout": 8, ... }
    """
    df = _load_burials_df()
    if df.empty:
        return Response({})

    classified = df[df["deathCategory"].notna() & (df["deathCategory"] != "")]
    counts = classified["deathCategory"].value_counts().to_dict()
    return Response(counts)


@api_view(["GET"])
def shelve_rate_by_stack(request):
    """GET /api/ml/analytics/shelve-rate-by-stack/
    Top tech stacks by shelved-project count (techStack is a multi-value
    array field, so each project can count toward several stacks).
    e.g. { "React": 15, "Flutter": 10, "Django": 8, ... }
    """
    df = _load_burials_df()
    if df.empty:
        return Response({})

    stack_counts = Counter()
    for stacks in df["techStack"]:
        stack_counts.update(stacks)

    return Response(dict(stack_counts.most_common(15)))


@api_view(["GET"])
def shelve_stage(request):
    """GET /api/ml/analytics/shelve-stage/
    Count of shelved projects per stage they were abandoned at.
    e.g. { "50% done": 18, "Prototype": 12, ... }
    """
    df = _load_burials_df()
    if df.empty:
        return Response({})

    return Response(df["stageDied"].value_counts().to_dict())


@api_view(["GET"])
def solo_vs_team(request):
    """GET /api/ml/analytics/solo-vs-team/
    Count of shelved projects by team size.
    e.g. { "solo": 20, "2-3": 14, "4+": 6 }
    """
    df = _load_burials_df()
    if df.empty:
        return Response({})

    return Response(df["teamSize"].value_counts().to_dict())


@api_view(["GET"])
def time_invested(request):
    """GET /api/ml/analytics/time-invested/
    Average time invested (in months) per domain before being shelved.
    e.g. { "web": 3.2, "ml": 5.1, "mobile": 2.8 }
    """
    df = _load_burials_df()
    if df.empty:
        return Response({})

    valid = df[df["timeSpentMonths"].notna()]
    averages = valid.groupby("domain")["timeSpentMonths"].mean().round(2).to_dict()
    return Response(averages)
