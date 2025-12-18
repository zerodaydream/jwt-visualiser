from app.core.config import settings
from app.llm.base import LLMProvider
from app.llm.gemini_adapter import GeminiAdapter
from app.llm.ollama_adapter import OllamaAdapter
from app.llm.mock_adapter import MockLLMAdapter
# OpenAI import removed/commented out as requested to minimize reliance
# from app.llm.openai_adapter import OpenAIAdapter 

class LLMFactory:
    @staticmethod
    def get_provider() -> LLMProvider:
        """
        Returns the LLM provider based on configuration.
        
        Priority:
        1. If USE_PAID_LLM is False, use Ollama (local)
        2. If USE_PAID_LLM is True and GOOGLE_API_KEY exists, use Gemini
        3. Otherwise, fall back to Mock adapter
        """
        # Check if user wants to disable paid LLMs
        if not settings.USE_PAID_LLM:
            print(f"INFO: Using Ollama local LLM (model: {settings.OLLAMA_MODEL})")
            return OllamaAdapter(
                host=settings.OLLAMA_HOST,
                model=settings.OLLAMA_MODEL,
                num_predict=settings.OLLAMA_NUM_PREDICT,
                temperature=settings.OLLAMA_TEMPERATURE,
                num_ctx=settings.OLLAMA_NUM_CTX
            )
        
        # If paid LLMs are enabled, try to use Gemini
        if settings.GOOGLE_API_KEY:
            print("INFO: Using Google Gemini API")
            return GeminiAdapter(api_key=settings.GOOGLE_API_KEY)
        
        # Fallback to mock if no keys available
        print("WARNING: No Google API Key found and paid LLM is enabled. Using Mock Adapter.")
        return MockLLMAdapter()