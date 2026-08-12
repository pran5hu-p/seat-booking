from functools import lru_cache
import os

from dotenv import load_dotenv
from pydantic import BaseModel, field_validator

from app.shared.utils import comma_separated_to_list

load_dotenv()


class Settings(BaseModel):
    database_url: str
    cors_origins: list[str]
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_pre_ping: bool = True
    db_pool_recycle: int = 3600

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if isinstance(value, str):
            return comma_separated_to_list(value)
        return value

    @field_validator("database_url")
    @classmethod
    def require_database_url(cls, value: str) -> str:
        if not value:
            raise ValueError("DATABASE_URL is not set")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv("DATABASE_URL", ""),
        cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000"),
        db_echo=os.getenv("DB_ECHO", "false").lower() in {"1", "true", "yes"},
        db_pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        db_max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
        db_pool_pre_ping=os.getenv("DB_POOL_PRE_PING", "true").lower() in {"1", "true", "yes"},
        db_pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
    )
