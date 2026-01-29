from pydantic import BaseModel
import os

class Settings(BaseModel):
    db_url: str = os.getenv("DB_URL", "sqlite:///./demo.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    jwt_algorithm: str = os.getenv("JWT_ALG", "HS256")
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_MINUTES", "120"))
    cors_allow_origins: list[str] = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",")

settings = Settings()
