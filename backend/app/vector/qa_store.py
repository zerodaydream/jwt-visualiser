"""
Q&A Storage Module for Learning from User Interactions

This module stores user questions and AI responses in the vector database,
enabling the system to "learn" from past interactions without fine-tuning.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import hashlib


class QAStore:
    """
    Stores and retrieves Q&A pairs for enhanced context in future queries.
    This provides a form of "learning" without model fine-tuning.
    """
    
    def __init__(self, vector_adapter=None):
        """
        Initialize the Q&A store.
        
        Args:
            vector_adapter: ChromaDB adapter instance (optional)
        """
        self.vector_adapter = vector_adapter
        self.qa_collection = "jwt_qa_history"
    
    async def store_qa_pair(
        self, 
        question: str, 
        answer: str, 
        jwt_context: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store a question-answer pair in the vector database.
        
        Args:
            question: User's question
            answer: AI's response
            jwt_context: JWT token context at the time of question
            metadata: Additional metadata (user_id, session_id, etc.)
            
        Returns:
            True if stored successfully
        """
        if not self.vector_adapter:
            return False
        
        try:
            # Create a unique ID for this Q&A pair
            qa_id = self._generate_qa_id(question, jwt_context)
            
            # Format the Q&A for storage
            qa_text = f"Question: {question}\nAnswer: {answer}"
            
            # Prepare metadata
            store_metadata = {
                "type": "qa_pair",
                "question": question[:200],  # Truncate for metadata
                "timestamp": datetime.utcnow().isoformat(),
                "jwt_algorithm": jwt_context.get('header', {}).get('alg', 'unknown'),
                "has_expiry": 'exp' in jwt_context.get('payload', {}),
                **(metadata or {})
            }
            
            # Store in vector DB
            await self.vector_adapter.add_documents(
                texts=[qa_text],
                metadatas=[store_metadata],
                ids=[qa_id],
                collection_name=self.qa_collection
            )
            
            return True
            
        except Exception as e:
            print(f"Error storing Q&A pair: {e}")
            return False
    
    async def retrieve_similar_qa(
        self, 
        question: str, 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar Q&A pairs from past interactions.
        
        Args:
            question: Current user question
            top_k: Number of similar Q&A pairs to retrieve
            
        Returns:
            List of similar Q&A pairs with metadata
        """
        if not self.vector_adapter:
            return []
        
        try:
            results = await self.vector_adapter.query(
                query_text=question,
                top_k=top_k,
                collection_name=self.qa_collection,
                filter_metadata={"type": "qa_pair"}
            )
            
            return results
            
        except Exception as e:
            print(f"Error retrieving similar Q&A: {e}")
            return []
    
    async def get_qa_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about stored Q&A pairs.
        
        Returns:
            Dictionary with statistics
        """
        if not self.vector_adapter:
            return {"total_pairs": 0, "enabled": False}
        
        try:
            # Get collection info
            collection = self.vector_adapter.get_collection(self.qa_collection)
            count = collection.count() if collection else 0
            
            return {
                "total_pairs": count,
                "enabled": True,
                "collection": self.qa_collection
            }
            
        except Exception as e:
            print(f"Error getting Q&A statistics: {e}")
            return {"total_pairs": 0, "enabled": False, "error": str(e)}
    
    def _generate_qa_id(self, question: str, jwt_context: Dict[str, Any]) -> str:
        """Generate a unique ID for a Q&A pair based on question and context."""
        # Create a hash from question and JWT algorithm
        content = f"{question}_{jwt_context.get('header', {}).get('alg', '')}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def clear_old_qa_pairs(self, days: int = 30) -> int:
        """
        Clear Q&A pairs older than specified days.
        
        Args:
            days: Number of days to keep
            
        Returns:
            Number of pairs deleted
        """
        if not self.vector_adapter:
            return 0
        
        try:
            # Calculate cutoff date
            from datetime import timedelta
            cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # This would require ChromaDB filtering by date
            # Implementation depends on your ChromaDB adapter capabilities
            # For now, return 0 as placeholder
            print(f"Clearing Q&A pairs older than {days} days (cutoff: {cutoff})")
            return 0
            
        except Exception as e:
            print(f"Error clearing old Q&A pairs: {e}")
            return 0

