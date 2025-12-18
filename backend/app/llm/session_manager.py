"""
Production-ready session memory management for LLM conversations.
Uses LangChain's memory system with automatic cleanup on disconnect.
"""
from typing import Dict, Optional, Any, List
from datetime import datetime
import uuid
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


class SessionMemory:
    """Manages conversation memory for a single session."""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.utcnow()
        self.last_accessed = datetime.utcnow()
        
        # Initialize LangChain conversation memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            input_key="input",
            output_key="output"
        )
        
        # Store JWT context for this session
        self.jwt_context: Optional[Dict[str, Any]] = None
    
    def add_user_message(self, content: str):
        """Add a user message to memory."""
        self.last_accessed = datetime.utcnow()
        self.memory.chat_memory.add_user_message(content)
    
    def add_ai_message(self, content: str):
        """Add an AI message to memory."""
        self.last_accessed = datetime.utcnow()
        self.memory.chat_memory.add_ai_message(content)
    
    def get_messages(self) -> List[Any]:
        """Get all messages from memory."""
        self.last_accessed = datetime.utcnow()
        return self.memory.chat_memory.messages
    
    def get_message_history_as_dict(self) -> List[Dict[str, str]]:
        """Get message history as a list of dicts for API responses."""
        messages = []
        for msg in self.memory.chat_memory.messages:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})
        return messages
    
    def set_jwt_context(self, jwt_context: Dict[str, Any]):
        """Store JWT context for this session."""
        self.jwt_context = jwt_context
        self.last_accessed = datetime.utcnow()
    
    def get_jwt_context(self) -> Optional[Dict[str, Any]]:
        """Get JWT context for this session."""
        return self.jwt_context
    
    def clear(self):
        """Clear all memory for this session."""
        self.memory.clear()
        self.jwt_context = None


class SessionManager:
    """
    Thread-safe session manager for WebSocket connections.
    Maintains separate memory for each active session.
    """
    
    def __init__(self):
        self.sessions: Dict[str, SessionMemory] = {}
    
    def create_session(self, websocket_id: Optional[str] = None) -> str:
        """
        Create a new session and return its ID.
        
        Args:
            websocket_id: Optional WebSocket connection ID
            
        Returns:
            Session ID string
        """
        session_id = websocket_id or str(uuid.uuid4())
        
        if session_id in self.sessions:
            # Session already exists, return existing
            return session_id
        
        self.sessions[session_id] = SessionMemory(session_id)
        print(f"[SessionManager] Created session: {session_id}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[SessionMemory]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and clean up its memory.
        
        Returns:
            True if session was deleted, False if not found
        """
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.clear()
            del self.sessions[session_id]
            print(f"[SessionManager] Deleted session: {session_id}")
            return True
        return False
    
    def get_active_session_count(self) -> int:
        """Get the number of active sessions."""
        return len(self.sessions)
    
    def cleanup_old_sessions(self, max_age_minutes: int = 60):
        """
        Clean up sessions older than max_age_minutes.
        Useful for preventing memory leaks from abandoned sessions.
        
        Args:
            max_age_minutes: Maximum age in minutes before cleanup
        """
        now = datetime.utcnow()
        sessions_to_delete = []
        
        for session_id, session in self.sessions.items():
            age_minutes = (now - session.last_accessed).total_seconds() / 60
            if age_minutes > max_age_minutes:
                sessions_to_delete.append(session_id)
        
        for session_id in sessions_to_delete:
            self.delete_session(session_id)
        
        if sessions_to_delete:
            print(f"[SessionManager] Cleaned up {len(sessions_to_delete)} old sessions")
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session.session_id,
            "created_at": session.created_at.isoformat(),
            "last_accessed": session.last_accessed.isoformat(),
            "message_count": len(session.get_messages()),
            "has_jwt_context": session.jwt_context is not None
        }


# Global session manager instance
_session_manager = SessionManager()


def get_session_manager() -> SessionManager:
    """Get the global session manager instance."""
    return _session_manager

