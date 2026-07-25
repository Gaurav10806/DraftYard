from django.core.management.base import BaseCommand

from ml_api import classifier
from ml_api.classifier import fit_new_model, CATEGORY_KEYWORDS
from ml_api.model_store import save_model
from ml_api.mongo_utils import get_burials_collection


class Command(BaseCommand):
    help = (
        "Train the TF-IDF + KMeans failure-pattern classifier on current "
        "burial data in MongoDB and persist it to ml_models/burial_classifier.pkl. "
        "Run this once, and again whenever enough new burials are added."
    )

    def handle(self, *args, **options):
        collection = get_burials_collection()
        docs = list(collection.find({}, {"whyItDied": 1}))
        texts = [d.get("whyItDied", "") for d in docs if d.get("whyItDied")]

        if len(texts) < 2:
            self.stdout.write(self.style.WARNING(
                f"Only found {len(texts)} burial text(s) in MongoDB — "
                "not enough to train on. Falling back to the built-in "
                "category keyword seed data so training has enough samples."
            ))
            texts = list(CATEGORY_KEYWORDS.values())

        self.stdout.write(f"Training on {len(texts)} burial text(s)...")
        vectorizer, kmeans, cluster_to_label, _ = fit_new_model(texts)

        save_model(vectorizer, kmeans, cluster_to_label)
        # Refresh the in-memory cache too, so a running dev server picks up
        # the new model without needing a restart.
        classifier.set_cached_model({
            "vectorizer": vectorizer,
            "kmeans": kmeans,
            "cluster_to_label": cluster_to_label,
        })

        self.stdout.write(self.style.SUCCESS(
            f"Trained on {len(texts)} texts and saved to "
            "ml_api/ml_models/burial_classifier.pkl"
        ))
        self.stdout.write("Cluster -> label mapping:")
        for cluster_id, label in sorted(cluster_to_label.items()):
            self.stdout.write(f"  {cluster_id}: {label}")
