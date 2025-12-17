from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, AsyncGenerator
from app.llm.base import LLMProvider

class OpenAIAdapter(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.llm = ChatOpenAI(api_key=api_key, model=model, temperature=0.3)

    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        # Construct a safe context string strictly from the JWT data
        context_str = (
            f"JWT Header: {context.get('header', {})}\n"
            f"JWT Payload Keys: {list(context.get('payload', {}).keys())}\n"
            f"Analysis: {context.get('analysis', {})}"
        )
        
        system_prompt = (
            "You are a Senior Security Engineer and JWT Expert. "
            "You are analyzing a JSON Web Token. "
            "Answer the user's question accurately based strictly on the provided token context. "
            "Do not hallucinate claims that are not present. "
            "Keep answers concise and technical."
        )

        messages = [
            SystemMessage(content=system_prompt),
            SystemMessage(content=f"Token Context:\n{context_str}"),
            HumanMessage(content=prompt)
        ]

        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def generate_response_stream(self, prompt: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response for real-time display.
        """
        context_str = (
            f"JWT Header: {context.get('header', {})}\n"
            f"JWT Payload Keys: {list(context.get('payload', {}).keys())}\n"
            f"Analysis: {context.get('analysis', {})}"
        )
        
        system_prompt = (
            "You are a Senior Security Engineer and JWT Expert. "
            "You are analyzing a JSON Web Token. "
            "Answer the user's question accurately based strictly on the provided token context. "
            "Do not hallucinate claims that are not present. "
            "Keep answers concise and technical."
        )

        messages = [
            SystemMessage(content=system_prompt),
            SystemMessage(content=f"Token Context:\n{context_str}"),
            HumanMessage(content=prompt)
        ]

        try:
            async for chunk in self.llm.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"Error: {str(e)}"