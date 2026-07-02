from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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

def classify_burials(texts):
    """
    texts: list of strings (the 'whyItDied' field)
    returns: list of category labels, same order as input
    """
    if len(texts) < 2:
        return _fallback_nearest_category(texts)

    n_clusters = min(8, len(texts))
    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    tfidf_matrix = vectorizer.fit_transform(texts)

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(tfidf_matrix)

    # Label each cluster centroid by nearest category keyword vector
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
                cluster_to_label[cluster_idx] = label
                used_labels.add(label)
                break
        else:
            cluster_to_label[cluster_idx] = category_names[best_order[0]]

    return [cluster_to_label[c] for c in cluster_ids]


def _fallback_nearest_category(texts):
    """Used when there's only 0-1 texts — KMeans needs at least 2 samples."""
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