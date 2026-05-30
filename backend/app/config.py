from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AIPOSTAL API"
    debug: bool = True
    cors_origins: List[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    datasets_dir: Path = Path(__file__).resolve().parent.parent / "datasets"
    min_fuzzy_score: int = 55
    min_validation_score: int = 60
    max_autocomplete_results: int = 8
    postoffice_search_radius_km: float = 50.0
    avg_road_speed_kmh: float = 55.0
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "aipostal"
    osrm_base_url: str = "https://router.project-osrm.org"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

