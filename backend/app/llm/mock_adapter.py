from app.llm.base import LLMProvider
from typing import Dict, Any
import asyncio

class MockLLMAdapter(LLMProvider):
    """
    Returns fake responses for testing/dev without API keys.
    """
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        await asyncio.sleep(1) # Simulate network latency
        return (
            "This is a MOCK response from the local backend.\n\n"
            "I see you are asking about: " + prompt + "\n\n"
            "Based on the token, the algorithm is: " + str(context.get('header', {}).get('alg'))
        )