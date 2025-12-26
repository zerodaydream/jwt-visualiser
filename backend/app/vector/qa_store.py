"""
Enhanced Q&A Storage Module for Learning from User Interactions

This module stores user questions and AI responses in the vector database,
enabling the system to "learn" from past interactions without fine-tuning.
Now includes source tracking and content previews for accuracy.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import hashlib


class QAStore:
    """
    Enhanced Q&A store with source tracking and learning capabilities.
    Stores Q&A pairs with full context and source attribution.
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
        sources_used: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store a question-answer pair with full source tracking.
        
        Args:
            question: User's question
            answer: AI's response
            jwt_context: JWT token context at the time of question
            sources_used: List of sources used to generate the answer (with previews)
            metadata: Additional metadata (user_id, session_id, etc.)
            
        Returns:
            True if stored successfully
        """
        if not self.vector_adapter:
            return False
        
        try:
            # Create a unique ID for this Q&A pair
            qa_id = self._generate_qa_id(question, jwt_context, datetime.utcnow())
            
            # Format the Q&A for storage with sources
            qa_text = f"Question: {question}\nAnswer: {answer}"
            
            # If sources were used, include them in the text for better retrieval
            if sources_used:
                source_context = "\n\nSources Referenced:\n"
                for idx, source in enumerate(sources_used[:3], 1):  # Top 3 sources
                    source_name = source.get("source", {}).get("name", "Unknown")
                    source_url = source.get("source", {}).get("url", "")
                    source_context += f"{idx}. {source_name} - {source_url}\n"
                qa_text += source_context
            
            # Prepare enhanced metadata with source tracking
            store_metadata = {
                "type": "qa_pair",
                "question": question[:500],  # Store more of the question
                "answer_preview": answer[:500],  # Store answer preview
                "timestamp": datetime.utcnow().isoformat(),
                "jwt_algorithm": jwt_context.get('header', {}).get('alg', 'unknown'),
                "has_expiry": 'exp' in jwt_context.get('payload', {}),
                "sources_count": len(sources_used) if sources_used else 0,
                "has_sources": bool(sources_used),
                **(metadata or {})
            }
            
            # Add source information to metadata
            if sources_used:
                # Store top source information
                top_source = sources_used[0] if sources_used else {}
                store_metadata.update({
                    "top_source_name": top_source.get("source", {}).get("name", ""),
                    "top_source_url": top_source.get("source", {}).get("url", ""),
                    "top_source_type": top_source.get("source", {}).get("type", ""),
                })
            
            # Store in vector DB
            success = await self.vector_adapter.add_documents(
                texts=[qa_text],
                metadatas=[store_metadata],
                ids=[qa_id],
                collection_name=self.qa_collection
            )
            
            if success:
                print(f"✓ Stored Q&A pair: '{question[:50]}...'")
            
            return success
            
        except Exception as e:
            print(f"Error storing Q&A pair: {e}")
            return False
    
    async def retrieve_similar_qa(
        self, 
        question: str, 
        top_k: int = 3,
        min_similarity: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar Q&A pairs from past interactions with source information.
        
        Args:
            question: Current user question
            top_k: Number of similar Q&A pairs to retrieve
            min_similarity: Minimum similarity score threshold (0-1)
            
        Returns:
            List of similar Q&A pairs with metadata and sources
        """
        if not self.vector_adapter:
            return []
        
        try:
            results = await self.vector_adapter.query(
                query_text=question,
                top_k=top_k,
                collection_name=self.qa_collection,
                filter_metadata={"type": "qa_pair"},
                include_distance=True
            )
            
            # Filter by similarity threshold
            filtered_results = []
            for result in results:
                if result.get("similarity_score", 0) >= min_similarity:
                    # Extract original question and answer from content
                    content = result.get("content", "")
                    
                    # Parse Q&A from content
                    qa_parts = self._parse_qa_content(content)
                    
                    filtered_results.append({
                        "original_question": qa_parts.get("question", ""),
                        "original_answer": qa_parts.get("answer", ""),
                        "sources": qa_parts.get("sources", []),
                        "similarity_score": result.get("similarity_score", 0),
                        "metadata": result.get("metadata", {}),
                        "timestamp": result.get("metadata", {}).get("timestamp", "")
                    })
            
            return filtered_results
            
        except Exception as e:
            print(f"Error retrieving similar Q&A: {e}")
            return []
    
    def _parse_qa_content(self, content: str) -> Dict[str, Any]:
        """
        Parse Q&A content to extract question, answer, and sources.
        
        Args:
            content: Raw Q&A content string
            
        Returns:
            Dictionary with parsed components
        """
        result = {
            "question": "",
            "answer": "",
            "sources": []
        }
        
        try:
            # Split by standard markers
            if "Question:" in content and "Answer:" in content:
                parts = content.split("Answer:", 1)
                result["question"] = parts[0].replace("Question:", "").strip()
                
                # Further split answer and sources
                answer_part = parts[1]
                if "Sources Referenced:" in answer_part:
                    answer_sources = answer_part.split("Sources Referenced:", 1)
                    result["answer"] = answer_sources[0].strip()
                    
                    # Parse sources
                    sources_text = answer_sources[1].strip()
                    for line in sources_text.split("\n"):
                        if line.strip() and "-" in line:
                            result["sources"].append(line.strip())
                else:
                    result["answer"] = answer_part.strip()
            else:
                # Fallback: treat entire content as answer
                result["answer"] = content
                
        except Exception as e:
            print(f"Error parsing Q&A content: {e}")
            result["answer"] = content
        
        return result
    
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
    
    def _generate_qa_id(self, question: str, jwt_context: Dict[str, Any], timestamp: datetime) -> str:
        """Generate a unique ID for a Q&A pair based on question, context, and timestamp."""
        # Create a hash from question, JWT algorithm, and timestamp for uniqueness
        content = f"{question}_{jwt_context.get('header', {}).get('alg', '')}_{timestamp.isoformat()}"
        return f"qa_{hashlib.md5(content.encode()).hexdigest()}"
    
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
            cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Get all Q&A pairs
            collection = self.vector_adapter.get_collection(self.qa_collection)
            if not collection:
                return 0
            
            # ChromaDB filtering by date would require custom implementation
            # For now, this is a placeholder for future enhancement
            print(f"Clearing Q&A pairs older than {days} days (cutoff: {cutoff})")
            print("Note: Date-based deletion requires custom implementation")
            return 0
            
        except Exception as e:
            print(f"Error clearing old Q&A pairs: {e}")
            return 0
    
    async def get_learning_insights(self) -> Dict[str, Any]:
        """
        Get insights about what the system has learned.
        
        Returns:
            Dictionary with learning insights
        """
        if not self.vector_adapter:
            return {"enabled": False}
        
        try:
            stats = await self.get_qa_statistics()
            
            # Get sample of recent Q&A pairs
            collection = self.vector_adapter.get_collection(self.qa_collection)
            
            insights = {
                **stats,
                "insights": {
                    "learning_enabled": True,
                    "can_reference_past_answers": stats.get("total_pairs", 0) > 0,
                    "recommendation": (
                        "The system is learning from user interactions. "
                        "Past Q&A pairs will be used to provide better answers."
                        if stats.get("total_pairs", 0) > 0 else
                        "No Q&A pairs stored yet. Start asking questions to build knowledge."
                    )
                }
            }
            
            return insights
            
        except Exception as e:
            print(f"Error getting learning insights: {e}")
            return {"enabled": False, "error": str(e)}

