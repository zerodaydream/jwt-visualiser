"""
Groq API adapter for LLM integration.
Groq provides ultra-fast inference for open-source models like Llama 3.1, Mixtral, etc.
Free tier: 30 requests/minute, great for development and small-scale production.
"""

from app.llm.base import LLMProvider
from typing import Dict, Any, AsyncGenerator
import httpx
import json
from app.llm.session_manager import get_session_manager

# Fetch Groq system prompt
from app.llm.prompts import get_system_prompt


class GroqAdapter(LLMProvider):
    """
    Groq API adapter for ultra-fast LLM inference.
    
    Supported models:
    - llama-3.1-8b-instant (fastest, great for chat)
    - llama-3.1-70b-versatile (most capable)
    - mixtral-8x7b-32768 (long context)
    - gemma-7b-it (efficient)
    """
    
    def __init__(
        self, 
        api_key: str,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.3,
        max_tokens: int = 2048
    ):
        """
        Initialize Groq adapter.
        
        Args:
            api_key: Groq API key (get from https://console.groq.com)
            model: Model to use (default: llama-3.1-8b-instant)
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum tokens to generate
        """
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
    
    def _build_messages(self, prompt: str, context: Dict[str, Any]) -> list:
        """Build messages array for Groq API."""
        messages = [
            {"role": "system", "content": get_system_prompt()}
        ]
        
        # Add JWT context
        jwt_data = context.get('jwt_data', {})
        context_str = (
            f"JWT Header: {jwt_data.get('header', {})}\n"
            f"JWT Payload: {jwt_data.get('payload', {})}\n"
            f"Signature Present: {jwt_data.get('signature_present', False)}\n"
        )
        
        # Get conversation history from session
        session_id = context.get('session_id')
        conversation_history = []
        
        if session_id:
            session_manager = get_session_manager()
            session = session_manager.get_session(session_id)
            if session:
                conversation_history = session.get_message_history_as_dict()
                if conversation_history:
                    # Remove the last message (current question)
                    conversation_history = conversation_history[:-1]
        
        # If there's conversation history, add it as actual message exchanges
        if conversation_history:
            # First, provide token context
            messages.append({"role": "user", "content": f"Token Context:\n{context_str}"})
            messages.append({"role": "assistant", "content": "I understand. I have the token context. I'm ready to help."})
            
            # Now add the FULL conversation history
            for msg in conversation_history:
                if msg['role'] == 'user':
                    messages.append({"role": "user", "content": msg['content']})
                elif msg['role'] == 'assistant':
                    messages.append({"role": "assistant", "content": msg['content']})
        else:
            # No history, just add token context
            messages.append({"role": "user", "content": f"Token Context:\n{context_str}"})
        
        # Add current question
        messages.append({"role": "user", "content": prompt})
        
        return messages
    
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        """
        Generate a response using Groq API (non-streaming).
        
        Args:
            prompt: The user's question
            context: JWT context and conversation history
            
        Returns:
            The generated response as a complete string
        """
        messages = self._build_messages(prompt, context)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                return "Error: Groq API rate limit exceeded. Please wait a moment and try again."
            elif e.response.status_code == 401:
                return "Error: Invalid Groq API key. Please check your configuration."
            else:
                return f"Error: Groq API returned status {e.response.status_code}"
        except httpx.TimeoutException:
            return "Error: Request to Groq API timed out. Please try again."
        except Exception as e:
            return f"Error generating response with Groq: {str(e)}"
    
    async def generate_response_stream(self, prompt: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response using Groq API.
        
        Args:
            prompt: The user's question
            context: JWT context and conversation history
            
        Yields:
            Response chunks as they arrive
        """
        messages = self._build_messages(prompt, context)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", self.api_url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]  # Remove "data: " prefix
                            
                            if data == "[DONE]":
                                break
                            
                            try:
                                chunk = json.loads(data)
                                if chunk["choices"][0]["delta"].get("content"):
                                    yield chunk["choices"][0]["delta"]["content"]
                            except json.JSONDecodeError:
                                continue
                                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                yield "Error: Groq API rate limit exceeded. Please wait a moment and try again."
            elif e.response.status_code == 401:
                yield "Error: Invalid Groq API key. Please check your configuration."
            else:
                yield f"Error: Groq API returned status {e.response.status_code}"
        except httpx.TimeoutException:
            yield "Error: Request to Groq API timed out. Please try again."
        except Exception as e:
            yield f"Error generating streaming response with Groq: {str(e)}"

