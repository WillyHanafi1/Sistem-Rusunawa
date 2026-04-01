from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://rusun_user:rusun_pass@localhost:5432/rusunawa"
    JWT_SECRET: str = "changeme-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    XENDIT_SECRET_KEY: str = ""
    XENDIT_WEBHOOK_TOKEN: str = ""
    MIDTRANS_SERVER_KEY: str = ""
    MIDTRANS_CLIENT_KEY: str = ""
    MIDTRANS_IS_PRODUCTION: bool = False
    ALLOWED_ORIGINS: str = ""
    # Perwal 36/2017 Compliance Settings
    DEPOSIT_MULTIPLIER: int = 2
    MIN_CONTRACT_MONTHS: int = 6
    MAX_CONTRACT_MONTHS: int = 24
    MAX_RENEWAL_MONTHS: int = 12
    # Late Penalty & Warning Settings
    PENALTY_RATE: float = 0.02
    STRD_DAY: int = 21
    WARNING_INTERVAL_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"



@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
