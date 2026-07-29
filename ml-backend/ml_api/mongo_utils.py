"""
Shared MongoDB connection helper.

We connect with pymongo directly (not through Django's ORM) since the
project data lives in the same MongoDB Atlas cluster the Node/Express
server writes to. The client is cached at module level so we don't open
a new connection on every request.
"""
import os
from pymongo import MongoClient

_client = None


def get_client():
    global _client
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError(
                "MONGO_URI is not set. Add it to ml-backend/.env "
                "(same value used by the Node server)."
            )
        _client = MongoClient(uri)
    return _client


def get_db():
    """Returns the database named in the URI path (e.g. '.../draftyard')."""
    return get_client().get_default_database()


def get_burials_collection():
    """Mongoose model 'Draft' -> collection 'drafts'."""
    return get_db()["drafts"]


def get_workspaces_collection():
    """Mongoose model 'Workspace' -> collection 'workspaces'."""
    return get_db()["workspaces"]

