from typing import List

import pandas as pd

from app.config import settings
from app.utils.fuzzy import expand_query_aliases


class DataStore:
    addresses: pd.DataFrame
    post_offices: pd.DataFrame
    pin_codes: pd.DataFrame
    search_choices: List[str]
    search_index: List[int]
    _token_index: dict

    def load(self) -> None:
        datasets = settings.datasets_dir
        addr_path = datasets / "indian_addresses.csv"
        po_path = datasets / "post_offices.csv"
        pin_path = datasets / "pin_codes.csv"

        if not addr_path.exists():
            raise FileNotFoundError(
                f"Dataset not found: {addr_path}\n"
                "Run: python datasets/download_datasets.py"
            )

        self.addresses = pd.read_csv(addr_path, low_memory=False)
        self.post_offices = pd.read_csv(po_path, low_memory=False)
        self.pin_codes = pd.read_csv(pin_path, low_memory=False)

        self.search_choices = self.addresses["search_text"].astype(str).tolist()
        self.search_index = self.addresses.index.tolist()

        # Token index for fast pre-filter on large India Post dataset
        self._token_index = {}
        for idx, text in enumerate(self.search_choices):
            for token in set(text.split()):
                if len(token) >= 2:
                    self._token_index.setdefault(token, []).append(idx)

    def get_candidate_indices(self, query: str, max_candidates: int = 2000) -> List[int]:
        """Narrow search space using token overlap before fuzzy scoring."""
        expanded = expand_query_aliases(query)
        tokens = [t for t in expanded.split() if len(t) >= 2]
        if not tokens:
            return self.search_index[:max_candidates]

        # Pincode shortcut — e.g. user types "500032"
        for token in tokens:
            if token.isdigit() and len(token) == 6:
                mask = self.addresses["pincode"].astype(str) == token
                hits = self.addresses.index[mask].tolist()
                if hits:
                    return hits[:max_candidates]

        scores: dict[int, int] = {}
        for token in tokens:
            # Exact token hits
            for idx in self._token_index.get(token, []):
                scores[idx] = scores.get(idx, 0) + 2

            # Prefix / substring hits on index keys
            for key, indices in self._token_index.items():
                if key.startswith(token) or token.startswith(key[: max(3, len(token))]):
                    for idx in indices:
                        scores[idx] = scores.get(idx, 0) + 1

        if not scores:
            return self.search_index[:max_candidates]

        # Prefer rows matching more query tokens
        min_matches = 2 if len(tokens) >= 2 else 1
        filtered = [(idx, s) for idx, s in scores.items() if s >= min_matches]
        if not filtered:
            filtered = list(scores.items())

        ranked = sorted(filtered, key=lambda x: x[1], reverse=True)
        return [idx for idx, _ in ranked[:max_candidates]]

    def get_address_by_index(self, idx: int) -> dict:
        row = self.addresses.iloc[idx]
        return {
            "id": str(row["id"]),
            "locality": str(row["locality"]),
            "city": str(row["city"]),
            "district": str(row["district"]),
            "state": str(row["state"]),
            "pincode": str(row["pincode"]),
            "lat": float(row["latitude"]),
            "lng": float(row["longitude"]),
            "label": str(row["full_address"]),
            "search_text": str(row["search_text"]),
        }


data_store = DataStore()
