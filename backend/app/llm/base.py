from abc import ABC, abstractmethod
from typing import Dict, Any, AsyncGenerator

class LLMProvider(ABC):
    """
    Abstract Base Class for LLM Providers.
    """
    
    @abstractmethod
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        """
        Generates a response based on the prompt and the JWT context.
        """
        pass
    
    @abstractmethod
    async def generate_response_stream(self, prompt: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response based on the prompt and the JWT context.
        Yields chunks of text as they are generated.
        """
        pass