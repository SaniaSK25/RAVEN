"""
Application configuration.

This module centralizes all configuration for the RAVEN backend.
Settings are loaded from environment variables and/or a .env file
using Pydantic Settings.

The rest of the application should import the global `settings`
instance instead of reading environment variables directly.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings.

    Values are loaded from environment variables.

    During local development:
        - values are loaded from `.env`

    During Docker/EC2 deployment:
        - environment variables override `.env`
    """

    # ==========================================================
    # Application
    # ==========================================================

    APP_NAME: str = "RAVEN Backend"
    APP_VERSION: str = "0.1.0"

    ENVIRONMENT: Literal[
        "development",
        "testing",
        "production",
    ] = "development"

    DEBUG: bool = True

    # ==========================================================
    # Database
    #
    # Dev default lives here in code (SQLite file).
    # Production overrides via DATABASE_URL env var / .env.production.
    # ==========================================================

    DATABASE_URL: str = "sqlite:///./raven.db"

    # ==========================================================
    # Security
    # ==========================================================

    SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ==========================================================
    # Pydantic Settings
    # ==========================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ==========================================================
    # Validators
    # ==========================================================

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        """
        Ensure only supported databases are used.
        """

        if not (
            value.startswith("sqlite")
            or value.startswith("postgresql")
        ):
            raise ValueError(
                "DATABASE_URL must use SQLite or PostgreSQL."
            )

        return value

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        """
        Validate application secret key.
        """

        if len(value) < 16:
            raise ValueError(
                "SECRET_KEY must contain at least 16 characters."
            )

        return value

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_access_token_expiry(cls, value: int) -> int:
        """
        Validate token lifetime.
        """

        if value <= 0:
            raise ValueError(
                "ACCESS_TOKEN_EXPIRE_MINUTES must be greater than zero."
            )

        return value


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    The configuration is loaded only once during the application's
    lifetime.
    """

    return Settings()


settings = get_settings()