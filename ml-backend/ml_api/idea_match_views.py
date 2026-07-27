"""
Matches a newly submitted idea against every existing draft using
literal word-overlap (TF-IDF weighted), not full-sentence semantic
similarity.

How it works:
- Every draft's text and the user's pitch/context are tokenized into
  individual words (lowercased, punctuation stripped, common English
  stopwords like "the"/"a"/"and" removed).
- TF-IDF gives each word a weight: common words across the whole
  corpus (e.g. "app", "project") count for less, rare/specific words
  (e.g. "invoicing", "aquarium") count for more.
- Cosine similarity between the query's word-vector and a draft's
  word-vector is mathematically zero unless they share at least one
  word — so a draft with zero shared words can never appear, and a
  draft that shares several specific words ranks above one that only
  shares one common word.
- No model training is required for this: TF-IDF is fit fresh on the
  current corpus + query on every request (this is fast even for
  thousands of drafts). If DraftYard's draft count grows very large,
  the vectorizer could be persisted the same way classifier.py
  persists its TF-IDF/KMeans model — not needed at this scale.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .mongo_utils import get_burials_collection

# Hard cap so a large database can't return hundreds of rows at once.
MAX_MATCHES = 50

# How many overlapping words to surface per match, for transparency
# (highest TF-IDF weight first).
MAX_KEYWORDS_SHOWN = 8


def _priority(score: float) -> str:
    """Bucket a raw TF-IDF cosine score into a priority label. These
    thresholds sit lower than a semantic-embedding scale would, because
    a literal word-overlap score of e.g. 0.3 already means a strong
    share of specific vocabulary in common."""
    if score >= 0.30:
        return "High"
    if score >= 0.12:
        return "Medium"
    return "Low"


def _draft_text(doc: dict) -> str:
    """Combine every meaningful text field on a draft into one string,
    so matching isn't limited to the one-liner alone."""
    parts = [
        doc.get("projectName", ""),
        doc.get("oneLiner", ""),
        " ".join(doc.get("techStack") or []),
        doc.get("failureReason", ""),
        doc.get("developmentMethodology", ""),
        doc.get("salvageable", ""),
    ]
    return " ".join(p for p in parts if p)


@api_view(["POST"])
def idea_match(request):
    """
    POST body: { "projectName"?: str, "pitch": str, "context": str }
    Returns every draft that shares at least one significant word with
    the query, ranked by TF-IDF weighted word-overlap (highest first),
    each tagged with a priority bucket and the matched keywords.
    """
    project_name = (request.data.get("projectName") or "").strip()
    pitch = (request.data.get("pitch") or "").strip()
    context = (request.data.get("context") or "").strip()

    query_text = " ".join(p for p in [project_name, pitch, context] if p)
    if not query_text:
        return Response(
            {"error": "Provide at least a 'pitch' or 'context' describing the idea."},
            status=400,
        )

    docs = list(get_burials_collection().find(
        {},
        {
            "projectName": 1, "oneLiner": 1, "domain": 1, "techStack": 1,
            "currentStage": 1, "failureReason": 1, "developmentMethodology": 1,
            "isAnonymous": 1,
        },
    ))

    if not docs:
        return Response({"query": query_text, "matchCount": 0, "matches": []})

    corpus_texts = [_draft_text(d) for d in docs]

    # Fit TF-IDF on the corpus + query together so the vocabulary
    # (and each word's importance) reflects both sides. Unigrams only,
    # per-word matching rather than exact-phrase matching.
    vectorizer = TfidfVectorizer(
        stop_words="english",
        token_pattern=r"(?u)\b[a-zA-Z]{2,}\b",
        ngram_range=(1, 1),
    )
    all_texts = corpus_texts + [query_text]
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    corpus_vectors = tfidf_matrix[:-1]
    query_vector = tfidf_matrix[-1]

    # This is 0 for any draft that shares zero vocabulary with the
    # query — cosine similarity of TF-IDF vectors with no common
    # nonzero dimensions is mathematically zero.
    similarities = cosine_similarity(query_vector, corpus_vectors)[0]

    analyzer = vectorizer.build_analyzer()
    query_words = set(analyzer(query_text))
    vocab_idf = dict(zip(vectorizer.get_feature_names_out(), vectorizer.idf_))

    ranked = sorted(
        zip(docs, corpus_texts, similarities),
        key=lambda triple: triple[2],
        reverse=True,
    )
    # "Any shared word" is the filter — a similarity > 0 already means
    # at least one non-stopword is shared between query and draft.
    above_floor = [(d, t, s) for d, t, s in ranked if s > 0][:MAX_MATCHES]

    matches = []
    for d, text, s in above_floor:
        draft_words = set(analyzer(text))
        shared = draft_words & query_words
        top_shared = sorted(shared, key=lambda w: vocab_idf.get(w, 0), reverse=True)[:MAX_KEYWORDS_SHOWN]

        matches.append({
            "id": str(d.get("_id")),
            "projectName": "Anonymous submission" if d.get("isAnonymous") else d.get("projectName"),
            "oneLiner": d.get("oneLiner"),
            "domain": d.get("domain"),
            "techStack": d.get("techStack", []),
            "currentStage": d.get("currentStage"),
            "failureReason": d.get("failureReason"),
            "similarity": round(float(s), 4),
            "similarityPct": round(float(s) * 100, 1),
            "priority": _priority(float(s)),
            "matchedKeywords": top_shared,
        })

    return Response({
        "query": query_text,
        "matchCount": len(matches),
        "matches": matches,
    })
