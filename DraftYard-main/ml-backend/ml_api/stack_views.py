"""
TASK 3 — Stack Insights API.

GET /api/ml/stack/<stack_name>/  (e.g. /api/ml/stack/React/)

For a given tech stack, returns:
  - total projects shelved using that stack
  - top 3 most common shelve reasons (deathCategory) for that stack
  - average stage reached before being shelved (stageDied is categorical,
    so we map it to a 1-5 "progress score" to average, then report the
    closest matching stage label too)
  - the most-upvoted "salvageable" insight/lesson from that stack's projects
    (this is the closest field in the schema to an "insight quote" —
    it's the reusable-lesson text authors leave on each burial)

Mem C consumes this for the Stack Insights UI page.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .mongo_utils import get_burials_collection

# Ordinal scale so we can average a categorical field.
_STAGE_SCORE = {
    "Idea only": 1,
    "Prototype": 2,
    "50% done": 3,
    "Almost complete": 4,
    "Launched but abandoned": 5,
}
_SCORE_TO_STAGE = {v: k for k, v in _STAGE_SCORE.items()}


@api_view(["GET"])
def stack_insights(request, stack_name):
    """GET /api/ml/stack/<stack_name>/"""
    collection = get_burials_collection()

    # Case-insensitive match against any entry in the techStack array.
    docs = list(collection.find({
        "techStack": {"$regex": f"^{stack_name}$", "$options": "i"}
    }))

    if not docs:
        return Response({
            "stack": stack_name,
            "total_shelved": 0,
            "top_shelve_reasons": [],
            "average_stage_reached": None,
            "most_upvoted_insight": None,
            "message": f"No shelved projects found using '{stack_name}' yet.",
        })

    total_shelved = len(docs)

    # --- Top 3 shelve reasons (by classified deathCategory) ---
    reason_counts = {}
    for d in docs:
        reason = d.get("deathCategory")
        if reason:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
    top_reasons = sorted(reason_counts.items(), key=lambda kv: kv[1], reverse=True)[:3]
    top_reasons = [{"reason": r, "count": c} for r, c in top_reasons]

    # --- Average stage reached ---
    scores = [_STAGE_SCORE[d["stageDied"]] for d in docs if d.get("stageDied") in _STAGE_SCORE]
    if scores:
        avg_score = round(sum(scores) / len(scores), 2)
        closest_stage = _SCORE_TO_STAGE[min(_SCORE_TO_STAGE, key=lambda s: abs(s - avg_score))]
        average_stage_reached = {"score": avg_score, "closest_stage": closest_stage}
    else:
        average_stage_reached = None

    # --- Most upvoted insight (salvageable field) ---
    with_insight = [d for d in docs if d.get("salvageable")]
    most_upvoted_insight = None
    if with_insight:
        top = max(with_insight, key=lambda d: d.get("upvotes", 0))
        most_upvoted_insight = {
            "projectName": top.get("projectName"),
            "insight": top.get("salvageable"),
            "upvotes": top.get("upvotes", 0),
        }

    return Response({
        "stack": stack_name,
        "total_shelved": total_shelved,
        "top_shelve_reasons": top_reasons,
        "average_stage_reached": average_stage_reached,
        "most_upvoted_insight": most_upvoted_insight,
    })