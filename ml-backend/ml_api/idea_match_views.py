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
  *exact* word — so on its own this would miss compound vocabulary
  like "healthtech" when someone types "health".
- To cover that, drafts with zero exact-word overlap get a second
  pass: substring containment in either direction (query word inside
  a draft word, or vice versa), for words long enough that the match
  is meaningful (see MIN_SUBSTRING_LEN). These are weaker signals than
  an exact shared word, so they're always bucketed "Low" priority via
  a capped synthetic score, and the matched draft-side word is shown
  so it's clear *why* it surfaced (e.g. "health" -> "healthtech").
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

from .mongo_utils import get_burials_collection, get_workspaces_collection

# Hard cap so a large database can't return hundreds of rows at once.
MAX_MATCHES = 50

# How many overlapping words to surface per match, for transparency
# (highest TF-IDF weight first).
MAX_KEYWORDS_SHOWN = 8

# Minimum word length for substring (partial-word) matching. Below this,
# containment checks throw up too much noise (e.g. "art" inside "start",
# "smart", "cart" — all unrelated).
MIN_SUBSTRING_LEN = 4

# Synthetic score for substring-only matches (no exact word shared).
# Deliberately capped under the "Medium" threshold in _priority — a
# partial-word hit is always a weaker signal than a real shared word,
# so it should never outrank an exact-overlap match.
SUBSTRING_SCORE_PER_WORD = 0.02
SUBSTRING_SCORE_CAP = 0.10


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


def _substring_overlap(query_words: set, draft_words: set) -> set:
    """Words from `draft_words` that contain, or are contained in, some
    word in `query_words` (excluding exact matches, which are already
    handled by the TF-IDF pass). Returns the draft-side words so the
    match reason stays human-readable, e.g. querying "health" against a
    draft containing "healthtech" returns {"healthtech"}."""
    hits = set()
    for qw in query_words:
        if len(qw) < MIN_SUBSTRING_LEN:
            continue
        for dw in draft_words:
            if dw == qw or len(dw) < MIN_SUBSTRING_LEN:
                continue
            if qw in dw or dw in qw:
                hits.add(dw)
    return hits


def _draft_text(doc: dict, ws: dict = None) -> str:
    """Combine every meaningful text field on a draft and its associated workspace document into one string,
    so matching checks both the draft metadata and workspace long descriptions, features, blockers, tasks, etc."""
    parts = [
        doc.get("projectName", ""),
        doc.get("oneLiner", ""),
        doc.get("description", ""),
        doc.get("category", ""),
        doc.get("domain", ""),
        " ".join(doc.get("techStack") or []),
        " ".join(doc.get("tags") or []),
        doc.get("failureReason", ""),
        doc.get("developmentMethodology", ""),
        doc.get("salvageable", ""),
    ]
    if ws:
        parts.extend([
            ws.get("longDescription", ""),
            ws.get("featuresCompleted", ""),
            ws.get("currentBlockers", ""),
            ws.get("externalLinks", ""),
        ])
        tasks = ws.get("tasks") or []
        if isinstance(tasks, list):
            parts.extend([t.get("title", "") for t in tasks if isinstance(t, dict)])
        milestones = ws.get("milestones") or []
        if isinstance(milestones, list):
            parts.extend([m.get("label", "") for m in milestones if isinstance(m, dict)])

    return " ".join(p for p in parts if p)


@api_view(["POST"])
def idea_match(request):
    """
    POST body: { "projectName"?: str, "pitch": str, "context": str }
    Returns every draft that shares at least one significant word with
    the query, ranked by TF-IDF weighted word-overlap (highest first),
    each tagged with a priority bucket and the matched keywords.
    Matches across draft metadata as well as workspace long descriptions,
    completed features, blockers, tasks, and milestones.
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
            "projectName": 1, "oneLiner": 1, "description": 1, "category": 1, "domain": 1,
            "techStack": 1, "tags": 1, "currentStage": 1, "failureReason": 1,
            "developmentMethodology": 1, "isAnonymous": 1,
        },
    ))

    if not docs:
        return Response({"query": query_text, "matchCount": 0, "matches": []})

    # Fetch workspace documents linked to drafts (by draftId) to include longDescription, blockers, etc.
    workspaces_by_draft_id = {}
    try:
        ws_docs = list(get_workspaces_collection().find(
            {},
            {
                "draftId": 1,
                "longDescription": 1,
                "featuresCompleted": 1,
                "currentBlockers": 1,
                "externalLinks": 1,
                "tasks": 1,
                "milestones": 1,
            }
        ))
        for ws in ws_docs:
            draft_id_val = ws.get("draftId")
            if draft_id_val:
                workspaces_by_draft_id[str(draft_id_val)] = ws
    except Exception:
        # Non-fatal fallback if workspaces collection doesn't exist yet
        pass

    corpus_texts = [
        _draft_text(d, workspaces_by_draft_id.get(str(d.get("_id"))))
        for d in docs
    ]

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

    # Build (doc, text, score, matched_keywords) for every draft: exact
    # TF-IDF overlap where it exists, otherwise fall back to substring
    # (partial-word) overlap with a capped synthetic score.
    candidates = []
    for d, text, s in zip(docs, corpus_texts, similarities):
        draft_words = set(analyzer(text))
        s = float(s)

        if s > 0:
            shared = draft_words & query_words
            keywords = sorted(shared, key=lambda w: vocab_idf.get(w, 0), reverse=True)
        else:
            substring_hits = _substring_overlap(query_words, draft_words)
            if not substring_hits:
                continue  # zero exact overlap and zero substring overlap — not a match
            s = min(SUBSTRING_SCORE_CAP, SUBSTRING_SCORE_PER_WORD * len(substring_hits))
            keywords = sorted(substring_hits)

        candidates.append((d, s, keywords[:MAX_KEYWORDS_SHOWN]))

    ranked = sorted(candidates, key=lambda triple: triple[1], reverse=True)[:MAX_MATCHES]

    matches = []
    for d, s, keywords in ranked:
        matches.append({
            "id": str(d.get("_id")),
            "projectName": "Anonymous submission" if d.get("isAnonymous") else d.get("projectName"),
            "oneLiner": d.get("oneLiner"),
            "domain": d.get("domain"),
            "techStack": d.get("techStack", []),
            "currentStage": d.get("currentStage"),
            "failureReason": d.get("failureReason"),
            "similarity": round(s, 4),
            "similarityPct": round(s * 100, 1),
            "priority": _priority(s),
            "matchedKeywords": keywords,
        })

    return Response({
        "query": query_text,
        "matchCount": len(matches),
        "matches": matches,
    })