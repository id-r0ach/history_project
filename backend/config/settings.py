from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    routerai_api_key: str
    routerai_base_url: str = "https://routerai.ru/api/v1"
    routerai_model: str = "qwen/qwen3-max"
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/soviet_chat"
    allowed_origins: str = "http://localhost:5173"

    # Yandex SpeechKit
    yandex_api_key: str = ""
    yandex_folder_id: str = ""

    # Balance tracker
    initial_balance: float = 500.0          # начальный депозит в рублях
    balance_file: str = "/app/data/balance.json"  # путь внутри Docker-контейнера

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
