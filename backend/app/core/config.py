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
    USE_PAID_LLM: bool = False 
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GOOGLE_API_KEY_1: str | None = None
    
    # Ollama Configuration (Local LLM)
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi3:3.8b"  # Phi-3 model, excellent for technical Q&A (3-4GB)
    OLLAMA_NUM_PREDICT: int = 2048  # Max tokens to generate (allows complete responses)
    OLLAMA_TEMPERATURE: float = 0.3  # Response creativity (0.0-1.0)
    OLLAMA_NUM_CTX: int = 2048  # Context window size (increased for better context)
    
    # Vector DB & RAG Configuration
    VECTOR_DB_PATH: str = "./chroma_db"
    ENABLE_RAG: bool = False  # Set to True to enable RAG with embeddings
    ENABLE_QA_LEARNING: bool = False  # Store Q&A pairs for future retrieval (RAG-based learning)

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        env_file_encoding="utf-8",
        env_parse_enums=False  # Disable automatic parsing
    )

settings = Settings()