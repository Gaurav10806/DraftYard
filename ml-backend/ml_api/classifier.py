from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from .model_store import load_model

CATEGORY_KEYWORDS = {
    "Scope Creep Syndrome": "kept adding features scope creep never finished expanded too much",
    "Solo Founder Burnout": "solo alone burned out too much weight one person tired exhausted",
    "Tutorial Hell Trap": "followed tutorials guides couldn't build independently copy pasted stuck",
    "The Pivot Spiral": "pivoted changed direction multiple times lost focus different idea",
    "Deployment Dread": "never deployed shipped production local only afraid to launch hosting",
    "Team Implosion": "team stopped showing up disappeared group quit members left",
    "Shiny Object Death": "new idea distracted excited about something else lost interest",
    "Real Life Interrupted": "exams job personal reasons life got busy no time",
}

# In-memory cache for the persisted model, populated at Django startup by
# MlApiConfig.ready() (see apps.py), and also refreshed whenever
# `python manage.py train_model` is run.
_MODEL_CACHE = None


def set_cached_model(model_dict):
    """Preload/refresh the in-memory model (called from apps.py / train_model)."""
    global _MODEL_CACHE
    _MODEL_CACHE = model_dict


def _get_cached_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        _MODEL_CACHE = load_model()
    return _MODEL_CACHE


def classify_burials(texts):
    """
    texts: list of strings (the 'whyItDied' field)
    returns: list of category labels, same order as input

    Uses the persisted TF-IDF + KMeans model when available (fast, consistent).
    Falls back to fitting a fresh model on-the-fly only if no model has been
    trained yet (run `python manage.py train_model` to fix that).
    """
    if not texts:
        return []

    model = _get_cached_model()
    if model is not None:
        return _classify_with_persisted_model(texts, model)

    if len(texts) < 2:
        return _fallback_nearest_category(texts)

    _, _, _, labels = fit_new_model(texts)
    return labels


def _classify_with_persisted_model(texts, model):
    vectorizer = model["vectorizer"]
    kmeans = model["kmeans"]
    cluster_to_label = model["cluster_to_label"]

    vectors = vectorizer.transform(texts)
    cluster_ids = kmeans.predict(vectors)
    return [cluster_to_label[c] for c in cluster_ids]


def fit_new_model(texts):
    """
    Fits a fresh TF-IDF + KMeans model on `texts` and labels each cluster
    by nearest CATEGORY_KEYWORDS centroid.

    Returns: (vectorizer, kmeans, cluster_to_label, labels)
    Used by: `python manage.py train_model` (to persist) and the
    on-the-fly fallback above (if no persisted model exists yet).
    """
    n_clusters = min(8, len(texts))
    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    tfidf_matrix = vectorizer.fit_transform(texts)

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(tfidf_matrix)

    category_names = list(CATEGORY_KEYWORDS.keys())
    category_vectors = vectorizer.transform(CATEGORY_KEYWORDS.values())
    similarity = cosine_similarity(kmeans.cluster_centers_, category_vectors)

    cluster_to_label = {}
    used_labels = set()
    for cluster_idx in np.argsort(-similarity.max(axis=1)):
        best_order = np.argsort(-similarity[cluster_idx])
        for cat_idx in best_order:
            label = category_names[cat_idx]
            if label not in used_labels:
                cluster_to_label[int(cluster_idx)] = label
                used_labels.add(label)
                break
        else:
            cluster_to_label[int(cluster_idx)] = category_names[best_order[0]]

    labels = [cluster_to_label[c] for c in cluster_ids]
    return vectorizer, kmeans, cluster_to_label, labels


def _fallback_nearest_category(texts):
    """Used when there's only 0-1 texts and no persisted model exists yet."""
    if not texts:
        return []
    vectorizer = TfidfVectorizer(stop_words="english")
    corpus = texts + list(CATEGORY_KEYWORDS.values())
    matrix = vectorizer.fit_transform(corpus)
    text_vecs = matrix[:len(texts)]
    cat_vecs = matrix[len(texts):]
    sims = cosine_similarity(text_vecs, cat_vecs)
    category_names = list(CATEGORY_KEYWORDS.keys())
    return [category_names[i] for i in sims.argmax(axis=1)]
