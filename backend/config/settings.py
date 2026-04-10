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
    yandex_api_key: str = ""          # IAM-токен или API-ключ сервисного аккаунта
    yandex_folder_id: str = ""        # folder_id облачного каталога

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
