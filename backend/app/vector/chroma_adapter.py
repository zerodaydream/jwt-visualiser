"""
Enhanced ChromaDB Adapter with Source Tracking and Content Previews
Provides accurate source attribution with exact content snippets.
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings
from app.vector.base import VectorStoreProvider
import hashlib


class ChromaAdapter(VectorStoreProvider):
    def __init__(self):
        """
        Initialize ChromaDB adapter with enhanced metadata support.
        Uses settings.ENABLE_RAG to determine if RAG should be enabled.
        Uses free local HuggingFace embeddings (no API key required).
        """
        if not settings.ENABLE_RAG:
            self.client = None
            self.collections = {}
            self.embedding_fn = None
            print("INFO: RAG is disabled (ENABLE_RAG=False). Using direct Q&A only.")
            return
            
        # Initialize persistent local storage with telemetry disabled
        self.client = chromadb.PersistentClient(
            path=settings.VECTOR_DB_PATH,
            settings=ChromaSettings(
                anonymized_telemetry=False,  # Disable telemetry
                allow_reset=True
            )
        )
        
        # Multiple collections for different purposes
        self.collections = {
            "jwt_knowledge": self.client.get_or_create_collection(
                name="jwt_knowledge",
                metadata={"hnsw:space": "cosine", "description": "JWT specifications and documentation"}
            ),
            "jwt_qa_history": self.client.get_or_create_collection(
                name="jwt_qa_history",
                metadata={"hnsw:space": "cosine", "description": "User Q&A pairs for learning"}
            )
        }
        
        # Use free local HuggingFace embeddings (runs locally, no API quota)
        try:
            self.embedding_fn = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}  # Better for similarity search
            )
            print("INFO: RAG enabled with local HuggingFace embeddings (all-MiniLM-L6-v2)")
        except Exception as e:
            self.embedding_fn = None
            print(f"WARNING: Failed to load embeddings model: {e}")

    async def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict[str, Any]] = None,
        ids: List[str] = None,
        collection_name: str = "jwt_knowledge"
    ) -> bool:
        """
        Add documents to ChromaDB with enhanced metadata and previews.
        
        Args:
            texts: List of document texts
            metadatas: List of metadata dicts (must include source info)
            ids: Optional list of document IDs
            collection_name: Target collection name
            
        Returns:
            True if successful
        """
        if not self.embedding_fn or not self.client:
            return False

        try:
            collection = self.collections.get(
                collection_name,
                self.client.get_or_create_collection(name=collection_name)
            )
            
            # Generate embeddings
            embeddings = self.embedding_fn.embed_documents(texts)
            
            # Ensure IDs exist
            if ids is None:
                ids = [self._generate_id(text, i) for i, text in enumerate(texts)]
            
            # Enhance metadata with content previews
            if metadatas:
                for i, (text, metadata) in enumerate(zip(texts, metadatas)):
                    # Add content preview (first 200 chars)
                    metadata["content_preview"] = self._create_preview(text, max_chars=200)
                    # Add full content length
                    metadata["content_length"] = len(text)
                    # Ensure all metadata values are strings, numbers, or booleans
                    metadatas[i] = self._sanitize_metadata(metadata)
            else:
                metadatas = [
                    {
                        "content_preview": self._create_preview(text, max_chars=200),
                        "content_length": len(text)
                    }
                    for text in texts
                ]
            
            # Add to Chroma
            collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            
            print(f"Added {len(texts)} documents to {collection_name}")
            return True
            
        except Exception as e:
            print(f"Error adding documents to ChromaDB: {e}")
            return False

    async def query(
        self,
        query_text: str,
        top_k: int = 5,
        collection_name: str = "jwt_knowledge",
        filter_metadata: Optional[Dict[str, Any]] = None,
        include_distance: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Query the vector database with enhanced results including content previews.
        
        Args:
            query_text: Query string
            top_k: Number of results to return
            collection_name: Collection to query
            filter_metadata: Optional metadata filters
            include_distance: Include similarity distance in results
            
        Returns:
            List of results with full metadata and content previews
        """
        if not self.embedding_fn or not self.client:
            return []

        try:
            collection = self.collections.get(
                collection_name,
                self.client.get_or_create_collection(name=collection_name)
            )
            
            # Generate query embedding
            query_embedding = self.embedding_fn.embed_query(query_text)
            
            # Query ChromaDB
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_metadata,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results with enhanced source information
            formatted_results = []
            
            if results and results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    document = results['documents'][0][i]
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    distance = results['distances'][0][i] if results['distances'] else None
                    
                    # ChromaDB cosine distance ranges from 0 (identical) to 2 (opposite)
                    # Convert to similarity: similarity = 1 - (distance / 2)
                    # This gives us a range from 1.0 (best) to -1.0 (worst)
                    if distance is not None:
                        similarity_score = 1 - (distance / 2)
                    else:
                        similarity_score = 0
                    
                    result = {
                        "content": document,
                        "content_preview": self._create_highlighted_preview(
                            document, 
                            query_text,
                            max_chars=300
                        ),
                        "metadata": metadata,
                        "source": {
                            "url": metadata.get("source_url", "Unknown"),
                            "name": metadata.get("source_name", "Unknown Source"),
                            "type": metadata.get("source_type", "documentation"),
                            "section": metadata.get("section_title", ""),
                            "section_id": metadata.get("section_id", ""),
                            "priority": metadata.get("priority", "medium")
                        },
                        "similarity_score": round(similarity_score, 4),
                        "distance": distance
                    }
                    
                    formatted_results.append(result)
            
            return formatted_results
            
        except Exception as e:
            print(f"Error querying ChromaDB: {e}")
            return []

    def similarity_search(
        self, 
        query: str, 
        k: int = 5,
        collection_name: str = "jwt_knowledge"
    ) -> List[Dict[str, Any]]:
        """
        Legacy compatibility method for similarity search.
        Returns simplified results for backward compatibility.
        """
        if not self.embedding_fn:
            return [{"content": "(RAG Disabled)", "source": {"name": "System"}}]

        try:
            import asyncio
            results = asyncio.run(self.query(
                query_text=query,
                top_k=k,
                collection_name=collection_name
            ))
            return results
        except Exception as e:
            print(f"Error in similarity search: {e}")
            return []

    def add_texts(
        self, 
        texts: List[str], 
        metadatas: List[dict] = None,
        collection_name: str = "jwt_knowledge"
    ):
        """
        Legacy compatibility method for adding texts.
        """
        import asyncio
        return asyncio.run(self.add_documents(
            texts=texts,
            metadatas=metadatas,
            collection_name=collection_name
        ))

    def get_collection(self, collection_name: str):
        """Get a collection by name."""
        if not self.client:
            return None
        return self.collections.get(
            collection_name,
            self.client.get_or_create_collection(name=collection_name)
        )

    async def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about all collections."""
        if not self.client:
            return {"enabled": False}
        
        stats = {"enabled": True, "collections": {}}
        
        for name, collection in self.collections.items():
            try:
                count = collection.count()
                stats["collections"][name] = {
                    "count": count,
                    "name": name
                }
            except Exception as e:
                stats["collections"][name] = {"error": str(e)}
        
        return stats

    def _generate_id(self, text: str, index: int) -> str:
        """Generate a unique ID for a document."""
        content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]
        return f"{content_hash}_{index}"

    def _create_preview(self, text: str, max_chars: int = 200) -> str:
        """
        Create a preview of the text content.
        
        Args:
            text: Full text content
            max_chars: Maximum characters in preview
            
        Returns:
            Preview string with ellipsis if truncated
        """
        # Clean up whitespace
        preview = " ".join(text.split())
        
        if len(preview) <= max_chars:
            return preview
            
        # Truncate at word boundary
        preview = preview[:max_chars]
        last_space = preview.rfind(' ')
        if last_space > max_chars * 0.8:  # Only truncate at space if it's not too far back
            preview = preview[:last_space]
            
        return preview + "..."

    def _create_highlighted_preview(
        self, 
        text: str, 
        query: str,
        max_chars: int = 300,
        context_chars: int = 100
    ) -> str:
        """
        Create a preview highlighting the most relevant part based on query.
        
        Args:
            text: Full text content
            query: Query string
            max_chars: Maximum characters in preview
            context_chars: Characters of context before and after match
            
        Returns:
            Preview string with relevant section
        """
        # Clean text
        text = " ".join(text.split())
        query_lower = query.lower()
        text_lower = text.lower()
        
        # Try to find query terms in text
        query_terms = query_lower.split()
        best_match_pos = -1
        
        for term in query_terms:
            pos = text_lower.find(term)
            if pos != -1:
                best_match_pos = pos
                break
        
        if best_match_pos == -1:
            # No match found, return start of text
            return self._create_preview(text, max_chars)
        
        # Extract context around match
        start = max(0, best_match_pos - context_chars)
        end = min(len(text), best_match_pos + context_chars + len(query))
        
        preview = text[start:end]
        
        # Add ellipsis if truncated
        if start > 0:
            preview = "..." + preview
        if end < len(text):
            preview = preview + "..."
            
        return preview

    def _sanitize_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize metadata to ensure ChromaDB compatibility.
        ChromaDB only supports string, int, float, and bool values.
        """
        sanitized = {}
        for key, value in metadata.items():
            if value is None:
                sanitized[key] = ""
            elif isinstance(value, (str, int, float, bool)):
                sanitized[key] = value
            elif isinstance(value, dict):
                # Convert dict to JSON string
                import json
                sanitized[key] = json.dumps(value)
            elif isinstance(value, list):
                # Convert list to comma-separated string
                sanitized[key] = ", ".join(str(v) for v in value)
            else:
                sanitized[key] = str(value)
        
        return sanitized

    async def delete_by_id(self, ids: List[str], collection_name: str = "jwt_knowledge") -> bool:
        """Delete documents by their IDs."""
        if not self.client:
            return False
            
        try:
            collection = self.get_collection(collection_name)
            collection.delete(ids=ids)
            return True
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return False

    async def update_document(
        self,
        document_id: str,
        text: str,
        metadata: Dict[str, Any],
        collection_name: str = "jwt_knowledge"
    ) -> bool:
        """Update an existing document."""
        if not self.embedding_fn or not self.client:
            return False
            
        try:
            collection = self.get_collection(collection_name)
            embedding = self.embedding_fn.embed_documents([text])[0]
            
            # Enhance metadata
            metadata["content_preview"] = self._create_preview(text, max_chars=200)
            metadata["content_length"] = len(text)
            metadata = self._sanitize_metadata(metadata)
            
            collection.update(
                ids=[document_id],
                documents=[text],
                embeddings=[embedding],
                metadatas=[metadata]
            )
            
            return True
        except Exception as e:
            print(f"Error updating document: {e}")
            return False
