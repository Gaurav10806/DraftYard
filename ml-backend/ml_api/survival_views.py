from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .mongo_utils import get_burials_collection

TOP_N = 5
# Below this cosine similarity, we treat it as "not really similar" —
# TF-IDF similarity on short one-liners is naturally low/noisy near zero.
SIMILARITY_THRESHOLD = 0.12


@api_view(["POST"])
def survival_check(request):
    idea = (request.data.get("idea") or "").strip()
    if not idea:
        return Response(
            {"error": "Provide an 'idea' string describing your project."},
            status=400,
        )

    docs = list(get_burials_collection().find(
        {},
        {
            "projectName": 1, "oneLiner": 1, "techStack": 1,
            "stageDied": 1, "deathCategory": 1,
        },
    ))

    if not docs:
        return Response({
            "idea": idea,
            "similar_projects": [],
            "survival_score": 80,
            "top_shelve_reason": None,
            "confidence_note": "No historical project data available yet to compare against.",
        })

    corpus_texts = [d.get("oneLiner", "") for d in docs]

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus_texts + [idea])
    idea_vector = matrix[-1]
    project_vectors = matrix[:-1]

    similarities = cosine_similarity(idea_vector, project_vectors)[0]

    ranked = sorted(zip(docs, similarities), key=lambda pair: pair[1], reverse=True)
    top_matches = [(d, s) for d, s in ranked[:TOP_N] if s >= SIMILARITY_THRESHOLD]

    similar_projects = [
        {
            "projectName": d.get("projectName"),
            "oneLiner": d.get("oneLiner"),
            "techStack": d.get("techStack", []),
            "stageDied": d.get("stageDied"),
            "deathCategory": d.get("deathCategory"),
            "similarity": round(float(s), 3),
        }
        for d, s in top_matches
    ]

    if not top_matches:
        survival_score = 80
        top_shelve_reason = None
        confidence_note = (
            "No closely related shelved projects found — this looks fairly "
            "novel on DraftYard so far. Score is an optimistic default, not a guarantee."
        )
    else:
        avg_similarity = sum(s for _, s in top_matches) / len(top_matches)
        survival_score = max(5, round(100 - avg_similarity * 100))

        reason_counts = {}
        for d, _ in top_matches:
            reason = d.get("deathCategory")
            if reason:
                reason_counts[reason] = reason_counts.get(reason, 0) + 1
        top_shelve_reason = (
            max(reason_counts.items(), key=lambda kv: kv[1])[0] if reason_counts else None
        )

        confidence_note = (
            f"Based on textual similarity to {len(top_matches)} past shelved "
            "project(s) on DraftYard. This is a heuristic signal, not a "
            "prediction — plenty of similar ideas succeed elsewhere."
        )

    return Response({
        "idea": idea,
        "similar_projects": similar_projects,
        "survival_score": survival_score,
        "top_shelve_reason": top_shelve_reason,
        "confidence_note": confidence_note,
    })