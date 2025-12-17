import chromadb
from typing import List
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings
from app.vector.base import VectorStoreProvider

class ChromaAdapter(VectorStoreProvider):
    def __init__(self):
        """
        Initialize ChromaDB adapter.
        Uses settings.ENABLE_RAG to determine if RAG should be enabled.
        Uses free local HuggingFace embeddings (no API key required).
        """
        if not settings.ENABLE_RAG:
            self.client = None
            self.collection = None
            self.embedding_fn = None
            print("INFO: RAG is disabled (ENABLE_RAG=False). Using direct Q&A only.")
            return
            
        # Initialize persistent local storage
        self.client = chromadb.PersistentClient(path=settings.VECTOR_DB_PATH)
        self.collection = self.client.get_or_create_collection(name="jwt_specs")
        
        # Use free local HuggingFace embeddings (runs locally, no API quota)
        try:
            self.embedding_fn = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            print("INFO: RAG enabled with local HuggingFace embeddings (all-MiniLM-L6-v2)")
        except Exception as e:
            self.embedding_fn = None
            print(f"WARNING: Failed to load embeddings model: {e}")

    def add_texts(self, texts: List[str], metadatas: List[dict] = None):
        if not self.embedding_fn:
            return

        # Generate embeddings
        embeddings = self.embedding_fn.embed_documents(texts)
        
        # Add to Chroma
        ids = [str(i) for i in range(len(texts))] # Simple IDs
        self.collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def similarity_search(self, query: str, k: int = 3) -> List[str]:
        if not self.embedding_fn:
            return ["(RAG Disabled: No API Key)"]

        query_embedding = self.embedding_fn.embed_query(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        # Flatten results
        return results['documents'][0] if results['documents'] else []