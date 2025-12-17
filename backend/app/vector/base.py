from abc import ABC, abstractmethod
from typing import List

class VectorStoreProvider(ABC):
    @abstractmethod
    def add_texts(self, texts: List[str], metadatas: List[dict] = None):
        """Add text documents to the vector store."""
        pass

    @abstractmethod
    def similarity_search(self, query: str, k: int = 3) -> List[str]:
        """Return the top k most similar text snippets."""
        pass