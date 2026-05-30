from typing import List, Optional

from app.config import settings
from app.models.schemas import AddressInput, AddressSuggestion, ValidatedAddress
from app.services.data_loader import data_store
from app.utils.fuzzy import best_match_score, expand_query_aliases, fuzzy_search, normalize_query, token_match_bonus


def _row_to_suggestion(row: dict, score: float) -> AddressSuggestion:
    return AddressSuggestion(
        id=row["id"],
        label=row["label"],
        locality=row["locality"],
        city=row["city"],
        state=row["state"],
        pincode=row["pincode"],
        lat=row["lat"],
        lng=row["lng"],
        score=round(min(99.0, score), 1),
    )


def search_addresses(query: str, limit: Optional[int] = None) -> List[AddressSuggestion]:
    if not query or len(query.strip()) < 2:
        return []

    max_results = limit or settings.max_autocomplete_results
    expanded_query = expand_query_aliases(query)
    candidate_indices = data_store.get_candidate_indices(expanded_query)
    candidate_choices = [data_store.search_choices[i] for i in candidate_indices]

    matches = fuzzy_search(
        expanded_query,
        candidate_choices,
        limit=max_results * 3,
        score_cutoff=settings.min_fuzzy_score,
    )

    ranked: List[tuple[float, int, float]] = []
    for _, score, rel_idx in matches:
        idx = candidate_indices[rel_idx]
        row = data_store.get_address_by_index(idx)
        combined = score + token_match_bonus(expanded_query, row["search_text"])
        ranked.append((combined, idx, score))

    ranked.sort(key=lambda x: x[0], reverse=True)

    suggestions: List[AddressSuggestion] = []
    seen: set = set()
    for combined, idx, base_score in ranked:
        row = data_store.get_address_by_index(idx)
        if row["id"] in seen:
            continue
        seen.add(row["id"])
        suggestions.append(_row_to_suggestion(row, combined))
        if len(suggestions) >= max_results:
            break
    return suggestions


def _validate_with_coords(address: str, lat: float, lng: float) -> ValidatedAddress:
    matches = search_addresses(address, limit=1)
    if matches:
        best = matches[0]
        confidence = min(99.0, best.score + 5.0)
        return ValidatedAddress(
            input=address,
            matched_label=best.label,
            locality=best.locality,
            city=best.city,
            state=best.state,
            pincode=best.pincode,
            lat=lat,
            lng=lng,
            confidence=round(confidence, 1),
            is_valid=True,
            serviceable=True,
        )

    return ValidatedAddress(
        input=address,
        matched_label=address,
        locality="",
        city="",
        state="",
        pincode="",
        lat=lat,
        lng=lng,
        confidence=72.0,
        is_valid=True,
        serviceable=True,
    )


def validate_address(payload: AddressInput) -> ValidatedAddress:
    query = payload.address.strip()
    if not query:
        raise ValueError("Address is required")

    if payload.lat is not None and payload.lng is not None:
        return _validate_with_coords(query, payload.lat, payload.lng)

    suggestions = search_addresses(query, limit=5)
    if not suggestions:
        return ValidatedAddress(
            input=query,
            matched_label=query,
            locality="",
            city="",
            state="",
            pincode="",
            lat=0.0,
            lng=0.0,
            confidence=0.0,
            is_valid=False,
            serviceable=False,
        )

    best = suggestions[0]
    direct_score = best_match_score(query, best.label)
    confidence = max(best.score, direct_score)

    is_valid = confidence >= settings.min_validation_score
    serviceable = is_valid and best.lat != 0 and best.lng != 0

    return ValidatedAddress(
        input=query,
        matched_label=best.label,
        locality=best.locality,
        city=best.city,
        state=best.state,
        pincode=best.pincode,
        lat=best.lat,
        lng=best.lng,
        confidence=round(confidence, 1),
        is_valid=is_valid,
        serviceable=serviceable,
    )
