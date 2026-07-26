"""
Handles saving/loading the trained TF-IDF + KMeans model to/from disk.

TASK 1 (ML Model Persistence): instead of refitting KMeans on every
/api/ml/classify/ call (which gives inconsistent results with 1-2 texts),
we train once via `python manage.py train_model` and load the saved
.pkl at Django startup.
"""
from pathlib import Path
import joblib

MODEL_DIR = Path(__file__).resolve().parent / "ml_models"
MODEL_PATH = MODEL_DIR / "burial_classifier.pkl"


def save_model(vectorizer, kmeans, cluster_to_label):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "vectorizer": vectorizer,
            "kmeans": kmeans,
            "cluster_to_label": cluster_to_label,
        },
        MODEL_PATH,
    )


def load_model():
    """Returns the saved model dict, or None if it hasn't been trained yet."""
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)
