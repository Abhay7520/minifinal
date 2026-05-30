import logging
import os
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings


logger = logging.getLogger("aipostal.database")

class MockCursor:
    def __init__(self, items):
        self.items = items

    def __iter__(self):
        return iter(self.items)

    def sort(self, key, direction=1):
        # Simple sorting if it's a string key
        reverse = (direction == -1)
        try:
            self.items = sorted(self.items, key=lambda x: x.get(key, ""), reverse=reverse)
        except Exception:
            pass
        return self

    def limit(self, n):
        self.items = self.items[:n]
        return self

    def to_list(self):
        return self.items

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.documents = []

    def insert_one(self, doc):
        # PyMongo modifies the dictionary in-place by adding _id
        if "_id" not in doc:
            import uuid
            doc["_id"] = str(uuid.uuid4())
        # Copy to avoid side-effects
        self.documents.append(doc.copy())
        class MockResult:
            inserted_id = doc["_id"]
        return MockResult()

    def insert_many(self, docs):
        inserted_ids = []
        for doc in docs:
            res = self.insert_one(doc)
            inserted_ids.append(res.inserted_id)
        class MockResult:
            inserted_ids = inserted_ids
        return MockResult()

    def find_one(self, query):
        if not query:
            return self.documents[0] if self.documents else None
        for doc in self.documents:
            if self._match(doc, query):
                return doc.copy()
        return None

    def find(self, query=None):
        if not query:
            return MockCursor([doc.copy() for doc in self.documents])
        matched = [doc.copy() for doc in self.documents if self._match(doc, query)]
        return MockCursor(matched)

    def update_one(self, query, update_op):
        doc = self.find_one(query)
        if not doc:
            class MockResult:
                matched_count = 0
                modified_count = 0
            return MockResult()

        # Find exact index in internal storage to update
        idx = -1
        for i, d in enumerate(self.documents):
            if d["_id"] == doc["_id"]:
                idx = i
                break

        if idx != -1:
            if "$set" in update_op:
                for k, v in update_op["$set"].items():
                    self.documents[idx][k] = v
            if "$push" in update_op:
                for k, v in update_op["$push"].items():
                    if k not in self.documents[idx]:
                        self.documents[idx][k] = []
                    self.documents[idx][k].append(v)
            class MockResult:
                matched_count = 1
                modified_count = 1
            return MockResult()

        class MockResult:
            matched_count = 0
            modified_count = 0
        return MockResult()

    def delete_one(self, query):
        doc = self.find_one(query)
        if not doc:
            class MockResult:
                deleted_count = 0
            return MockResult()

        self.documents = [d for d in self.documents if d["_id"] != doc["_id"]]
        class MockResult:
            deleted_count = 1
        return MockResult()

    def count_documents(self, query):
        if not query:
            return len(self.documents)
        return len([d for d in self.documents if self._match(d, query)])

    def _match(self, doc, query):
        for k, v in query.items():
            if k == "_id" and doc.get("_id") == v:
                continue
            # Simple field match
            if doc.get(k) != v:
                return False
        return True

class MockDatabase:
    def __init__(self):
        self._collections = {}

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

class MongoDBService:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False

    def connect(self):
        url = settings.mongodb_url
        db_name = settings.mongodb_db_name
        logger.info(f"Connecting to MongoDB at {url}...")
        try:
            # We set serverSelectionTimeoutMS to 3 seconds to fail fast if DB is down
            self.client = pymongo.MongoClient(url, serverSelectionTimeoutMS=3000)
            # Try to perform a ping to check connection
            self.client.admin.command('ping')
            self.db = self.client[db_name]
            self.is_mock = False
            logger.info("Successfully connected to real MongoDB instance!")
            print("Successfully connected to real MongoDB instance!")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            # If we silently fall back to an in-memory mock, signup/login may “work” but nothing is persisted.
            # Allow mock mode only when explicitly enabled.
            use_mock = os.getenv("USE_MOCK_DB", "false").strip().lower() in {"1", "true", "yes"}
            logger.exception("Failed to connect to MongoDB: %s. use_mock=%s", e, use_mock)
            if not use_mock:
                raise

            logger.warning("Falling back to in-memory MockDatabase because USE_MOCK_DB=true")
            print(f"MongoDB warning: {e}. Falling back to in-memory MockDatabase (USE_MOCK_DB=true).")
            self.client = None
            self.db = MockDatabase()
            self.is_mock = True


    def get_collection(self, name: str):
        if self.db is None:
            self.connect()
        return self.db[name]

# Single global instance
db_service = MongoDBService()
