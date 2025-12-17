from app.core.config import settings
from app.llm.base import LLMProvider
from app.llm.gemini_adapter import GeminiAdapter
from app.llm.mock_adapter import MockLLMAdapter
# OpenAI import removed/commented out as requested to minimize reliance
# from app.llm.openai_adapter import OpenAIAdapter 

class LLMFactory:
    @staticmethod
    def get_provider() -> LLMProvider:
        """
        Returns the LLM provider.
        Prioritizes Google Gemini 2.5 Flash.
        """
        if settings.GOOGLE_API_KEY:
            return GeminiAdapter(api_key=settings.GOOGLE_API_KEY)
        
        # We can leave OpenAI as a fallback if you ever change your mind, 
        # but for now, if no Google Key, we go straight to Mock.
        
        print("WARNING: No Google API Key found. Using Mock Adapter.")
        return MockLLMAdapter()