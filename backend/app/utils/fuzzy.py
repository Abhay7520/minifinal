from typing import List, Tuple

from rapidfuzz import fuzz, process

CITY_ALIASES = {
    "hyd": "hyderabad",
    "sec": "secunderabad",
    "blr": "bengaluru",
    "bangalore": "bengaluru",
    "delhi": "delhi",
    "newdelhi": "delhi",
    "bombay": "mumbai",
    "madras": "chennai",
    "cal": "kolkata",
    "calcutta": "kolkata",
    "pune": "pune",
    "chn": "chennai",
    "chennai": "chennai",
    "gurugram": "gurugram",
    "gurgaon": "gurugram",
    "noida": "noida",
}


def normalize_query(text: str) -> str:
    return " ".join(text.lower().strip().split())


def expand_query_aliases(query: str) -> str:
    tokens = normalize_query(query).split()
    expanded = [CITY_ALIASES.get(t, t) for t in tokens]
    return " ".join(expanded)


def fuzzy_search(
    query: str,
    choices: List[str],
    limit: int = 8,
    score_cutoff: int = 55,
) -> List[Tuple[str, float, int]]:
    """Return (choice, score, index) tuples ranked by relevance."""
    if not query.strip() or not choices:
        return []

    normalized = normalize_query(query)
    results = process.extract(
        normalized,
        choices,
        scorer=fuzz.WRatio,
        limit=limit,
        score_cutoff=score_cutoff,
    )
    return [(match, float(score), idx) for match, score, idx in results]


def best_match_score(query: str, candidate: str) -> float:
    q = expand_query_aliases(query)
    c = normalize_query(candidate)
    return float(
        max(
            fuzz.WRatio(q, c),
            fuzz.token_set_ratio(q, c),
            fuzz.partial_ratio(q, c),
        )
    )


def token_match_bonus(query: str, search_text: str) -> float:
    """Boost score when query tokens appear in the search text (incl. prefix match)."""
    expanded = expand_query_aliases(query)
    tokens = [t for t in expanded.split() if len(t) >= 2]
    if not tokens:
        return 0.0

    words = search_text.split()
    bonus = 0.0
    for token in tokens:
        if token in search_text:
            bonus += 18.0
        elif any(word.startswith(token) for word in words):
            bonus += 14.0
        elif any(token in word for word in words):
            bonus += 8.0
    return bonus
