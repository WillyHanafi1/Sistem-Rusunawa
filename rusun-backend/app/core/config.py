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

    class Config:
        env_file = ".env"
        extra = "ignore"



@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
