from django.apps import AppConfig


class MlApiConfig(AppConfig):
    name = 'ml_api'

    def ready(self):
        # Preload the persisted TF-IDF + KMeans model once at startup so
        # /api/ml/classify/ doesn't retrain on every request.
        from .model_store import load_model
        from . import classifier

        model = load_model()
        if model is not None:
            classifier.set_cached_model(model)
            print("[ml_api] Loaded persisted classifier from ml_models/burial_classifier.pkl")
        else:
            print(
                "[ml_api] No persisted model found. Run "
                "`python manage.py train_model` to train and save one "
                "(falling back to on-the-fly training for now)."
            )
