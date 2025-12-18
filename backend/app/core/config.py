import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All sensitive values should be set via .env file or environment variables.
    """
    
    # Basic Configuration
    PROJECT_NAME: str = "JWT Visualiser"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], List]:
        if isinstance(v, str):
            if not v or v.strip() == "":
                return []
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    return []
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # LLM Configuration - ALL VALUES FROM ENV
    LLM_PROVIDER: str
    USE_PAID_LLM: bool = False
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GOOGLE_API_KEY_1: str | None = None
    
    # Ollama Configuration - ALL VALUES FROM ENV
    OLLAMA_HOST: str
    OLLAMA_MODEL: str
    OLLAMA_NUM_PREDICT: int = 2048
    OLLAMA_TEMPERATURE: float = 0.3
    OLLAMA_NUM_CTX: int = 2048
    
    # Vector DB & RAG Configuration - ALL VALUES FROM ENV
    VECTOR_DB_PATH: str = "./chroma_db"
    ENABLE_RAG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        env_file_encoding="utf-8",
        env_parse_enums=False
    )

settings = Settings()
