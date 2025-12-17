import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "JWT Visualiser"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    # We allow a list of origins for security
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], List]:
        if isinstance(v, str):
            if not v or v.strip() == "":
                return []
            # Handle JSON array format
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    return []
            # Handle comma-separated format
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # LLM Configuration
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GOOGLE_API_KEY_1: str | None = None
    
    # Vector DB & RAG Configuration
    VECTOR_DB_PATH: str = "./chroma_db"
    ENABLE_RAG: bool = False  # Set to True to enable RAG with embeddings

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        env_file_encoding="utf-8",
        env_parse_enums=False  # Disable automatic parsing
    )

settings = Settings()