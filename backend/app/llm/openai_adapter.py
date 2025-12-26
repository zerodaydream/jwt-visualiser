from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from typing import Dict, Any, AsyncGenerator
from app.llm.base import LLMProvider
from app.llm.session_manager import get_session_manager
from app.llm.prompts import get_system_prompt

class OpenAIAdapter(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.llm = ChatOpenAI(api_key=api_key, model=model, temperature=0.3)

    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        # Construct context from JWT data
        jwt_data = context.get('jwt_data', {})
        kb_context = context.get('knowledge_base', [])
        session_id = context.get('session_id')
        
        # Filter out RAG disabled messages
        kb_context = [doc for doc in kb_context if not doc.startswith("(RAG Disabled")]
        
        context_str = (
            f"JWT Header: {jwt_data.get('header', {})}\n"
            f"JWT Payload: {jwt_data.get('payload', {})}\n"
            f"Signature Present: {jwt_data.get('signature_present', False)}\n"
        )
        
        if kb_context:
            context_str += f"\nKnowledge Base Context: {kb_context}"

        messages = [
            SystemMessage(content=get_system_prompt()),
        ]
        
        # Get conversation history from session if available
        conversation_history = []
        if session_id:
            session_manager = get_session_manager()
            session = session_manager.get_session(session_id)
            if session:
                conversation_history = session.get_message_history_as_dict()
                if conversation_history:
                    # Remove the last message (current question) as we'll add it separately
                    conversation_history = conversation_history[:-1]
        
        # If there's conversation history, add it as actual message exchanges
        if conversation_history:
            # First, provide token context
            messages.append(HumanMessage(content=f"Token Context:\n{context_str}"))
            messages.append(AIMessage(content="I understand. I have the token context. I'm ready to help."))
            
            # Now add the FULL conversation history as actual messages
            for msg in conversation_history:
                if msg['role'] == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg['role'] == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
        else:
            # No history, just add token context
            messages.append(HumanMessage(content=f"Token Context:\n{context_str}"))
        
        # Add current question
        messages.append(HumanMessage(content=prompt))

        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def generate_response_stream(self, prompt: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response for real-time display.
        """
        # Build the same context as non-streaming
        jwt_data = context.get('jwt_data', {})
        kb_context = context.get('knowledge_base', [])
        session_id = context.get('session_id')
        
        # Filter out RAG disabled messages
        kb_context = [doc for doc in kb_context if not doc.startswith("(RAG Disabled")]
        
        context_str = (
            f"JWT Header: {jwt_data.get('header', {})}\n"
            f"JWT Payload: {jwt_data.get('payload', {})}\n"
            f"Signature Present: {jwt_data.get('signature_present', False)}\n"
        )
        
        if kb_context:
            context_str += f"\nKnowledge Base Context: {kb_context}"

        messages = [
            SystemMessage(content=get_system_prompt()),
        ]
        
        # Get conversation history from session if available
        conversation_history = []
        if session_id:
            session_manager = get_session_manager()
            session = session_manager.get_session(session_id)
            if session:
                conversation_history = session.get_message_history_as_dict()
                if conversation_history:
                    # Remove the last message (current question) as we'll add it separately
                    conversation_history = conversation_history[:-1]
        
        # If there's conversation history, add it as actual message exchanges
        if conversation_history:
            # First, provide token context
            messages.append(HumanMessage(content=f"Token Context:\n{context_str}"))
            messages.append(AIMessage(content="I understand. I have the token context. I'm ready to help."))
            
            # Now add the FULL conversation history as actual messages
            for msg in conversation_history:
                if msg['role'] == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg['role'] == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
        else:
            # No history, just add token context
            messages.append(HumanMessage(content=f"Token Context:\n{context_str}"))
        
        # Add current question
        messages.append(HumanMessage(content=prompt))

        try:
            async for chunk in self.llm.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"Error: {str(e)}"