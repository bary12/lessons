from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://deixis:deixis@localhost:5432/deixis"

    model_config = {"env_file": ".env"}


settings = Settings()
