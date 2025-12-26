from typing import Dict, Any, AsyncGenerator
from app.llm.base import LLMProvider
from app.llm.session_manager import get_session_manager
import httpx
import json
from app.llm.prompts import get_system_prompt

class OllamaAdapter(LLMProvider):
    """
    Ollama adapter for local LLM inference.
    Uses Ollama's API to generate responses with local models.
    Recommended models: llama3.2:3b, phi3:3.8b, gemma2:2b (3-4GB range)
    """

    def __init__(
        self, 
        host: str = "http://localhost:11434", 
        model: str = "llama3.2:3b",
        num_predict: int = 256,
        temperature: float = 0.3,
        num_ctx: int = 2048
    ):
        """
        Initializes the Ollama adapter.
        
        Args:
            host: The Ollama server host URL (default: http://localhost:11434)
            model: The Ollama model to use (default: llama3.2:3b)
            num_predict: Max tokens to generate (lower = faster)
            temperature: Response creativity 0.0-1.0
            num_ctx: Context window size (lower = faster, less memory)
        """
        self.host = host.rstrip('/')
        self.model = model
        self.num_predict = num_predict
        self.temperature = temperature
        self.num_ctx = num_ctx
        self.api_url = f"{self.host}/api/generate"
        self.chat_url = f"{self.host}/api/chat"

    def _build_system_prompt(self) -> str:
        """Build the system prompt for JWT analysis."""
        return get_system_prompt()

    def _build_context_string(self, context: Dict[str, Any]) -> str:
        """Build context string from JWT data and knowledge base."""
        import json
        import time
        
        jwt_data = context.get('jwt_data', {})
        kb_context = context.get('knowledge_base', [])
        
        # Filter out RAG disabled messages
        kb_context = [doc for doc in kb_context if not doc.startswith("(RAG Disabled")]
        
        header = jwt_data.get('header', {})
        payload = jwt_data.get('payload', {})
        
        # Build detailed context with actual values
        context_str = "=== TOKEN DATA ===\n\n"
        context_str += f"Header: {json.dumps(header, indent=2)}\n\n"
        context_str += f"Payload: {json.dumps(payload, indent=2)}\n\n"
        context_str += f"Signature Present: {jwt_data.get('signature_present', False)}\n\n"
        
        # Add helpful timestamp conversions if present
        if 'exp' in payload:
            try:
                exp_timestamp = int(payload['exp'])
                current_timestamp = int(time.time())
                is_expired = current_timestamp > exp_timestamp
                context_str += f"EXPIRATION INFO:\n"
                context_str += f"  - exp (expiration): {exp_timestamp} (Unix timestamp)\n"
                context_str += f"  - Current time: {current_timestamp} (Unix timestamp)\n"
                context_str += f"  - Status: {'EXPIRED' if is_expired else 'VALID'}\n\n"
            except (ValueError, TypeError):
                pass
        else:
            context_str += "EXPIRATION INFO:\n"
            context_str += "  - No 'exp' claim found - token does not expire\n\n"
        
        if 'iat' in payload:
            try:
                iat_timestamp = int(payload['iat'])
                context_str += f"ISSUED AT INFO:\n"
                context_str += f"  - iat (issued at): {iat_timestamp} (Unix timestamp)\n\n"
            except (ValueError, TypeError):
                pass
        
        if kb_context:
            context_str += f"Additional Context: {kb_context}\n"
        
        return context_str

    def _build_messages(self, prompt: str, context: Dict[str, Any]) -> list:
        """Build chat messages array for Ollama API using session-based memory."""
        context_str = self._build_context_string(context)
        base_system_prompt = self._build_system_prompt()
        session_id = context.get('session_id')
        
        messages = [
            {"role": "system", "content": base_system_prompt},
        ]
        
        # Get conversation history from session if available
        conversation_history = []
        if session_id:
            session_manager = get_session_manager()
            session = session_manager.get_session(session_id)
            if session:
                # Get all messages except the current one (already added by caller)
                all_messages = session.get_messages()
                # Convert to dict format (excluding the last message which is the current question)
                conversation_history = session.get_message_history_as_dict()
                if conversation_history:
                    # Remove the last message (current question) as we'll add it separately
                    conversation_history = conversation_history[:-1]
        
        # If there's conversation history, add it as actual message exchanges
        if conversation_history:
            # First, provide token context
            messages.append({"role": "user", "content": f"Token Context:\n{context_str}"})
            messages.append({"role": "assistant", "content": "I understand. I have the token context. I'm ready to help."})
            
            # Now add the FULL conversation history as actual messages
            for msg in conversation_history:
                role = msg['role']
                if role == 'user':
                    messages.append({"role": "user", "content": msg['content']})
                elif role == 'assistant':
                    messages.append({"role": "assistant", "content": msg['content']})
        else:
            # No history, just add token context
            messages.append({"role": "user", "content": f"Token Context:\n{context_str}"})
        
        # Add current question
        messages.append({"role": "user", "content": prompt})
        
        return messages

    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        """
        Generates a response using Ollama's chat API.
        
        Args:
            prompt: The user's question
            context: JWT context and conversation history
            
        Returns:
            The generated response as a complete string
        """
        messages = self._build_messages(prompt, context)
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.num_predict,
                "num_ctx": self.num_ctx,
                "num_gpu": 99,  # Use all available GPU layers (Apple Silicon optimization)
                "num_thread": 8  # M2 has 8 performance cores
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(self.chat_url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                return result.get("message", {}).get("content", "No response generated")
                
        except httpx.ConnectError:
            return (
                "Error: Cannot connect to Ollama server. "
                "Please make sure Ollama is running (run 'ollama serve' in terminal) "
                f"and the model '{self.model}' is installed (run 'ollama pull {self.model}')."
            )
        except httpx.TimeoutException:
            return "Error: Request to Ollama timed out. The model might be loading or the query is too complex."
        except Exception as e:
            return f"Error generating response with Ollama: {str(e)}"

    async def generate_response_stream(self, prompt: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response using Ollama's chat API.
        Yields text chunks as they are generated by the model.
        
        Args:
            prompt: The user's question
            context: JWT context and conversation history
            
        Yields:
            Text chunks as they are generated
        """
        messages = self._build_messages(prompt, context)
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.num_predict,
                "num_ctx": self.num_ctx,
                "num_gpu": 99,  # Use all available GPU layers
                "num_thread": 8  # Optimize for M2's 8 performance cores
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", self.chat_url, json=payload) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                chunk_data = json.loads(line)
                                if "message" in chunk_data:
                                    content = chunk_data["message"].get("content", "")
                                    if content:
                                        yield content
                                        
                                # Check if done
                                if chunk_data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
                                
        except httpx.ConnectError:
            yield (
                "Error: Cannot connect to Ollama server. "
                "Please make sure Ollama is running (run 'ollama serve' in terminal) "
                f"and the model '{self.model}' is installed (run 'ollama pull {self.model}')."
            )
        except httpx.TimeoutException:
            yield "Error: Request to Ollama timed out. The model might be loading or the query is too complex."
        except Exception as e:
            yield f"Error generating streaming response with Ollama: {str(e)}"

