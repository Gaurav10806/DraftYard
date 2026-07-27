"""
Loads and caches a sentence-embedding model.

Loading a transformer model from disk takes a second or two — doing
that on every /api/ml/idea-match/ request would make each search slow.
Instead we load it once, the first time it's needed, and keep it in a
module-level variable for the lifetime of the Django process (same
pattern as model_store.py uses for the TF-IDF/KMeans classifier).
"""
from sentence_transformers import SentenceTransformer

# all-MiniLM-L6-v2: ~80MB, runs fine on CPU, good general-purpose
# semantic quality. Downloaded automatically from Hugging Face the
# first time this is called (needs internet once; cached locally after).
MODEL_NAME = "all-MiniLM-L6-v2"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model
