"""
Document Processor for JWT Knowledge Base
Handles chunking, deduplication, and preprocessing of documents.
"""

from typing import List, Dict, Any, Tuple
import re
import hashlib
from datetime import datetime


class DocumentProcessor:
    """
    Processes documents for optimal storage and retrieval.
    Handles chunking, deduplication, and metadata enhancement.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        """
        Initialize document processor.
        
        Args:
            chunk_size: Target size for each chunk in characters
            chunk_overlap: Overlap between chunks for context preservation
            min_chunk_size: Minimum chunk size to keep
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.seen_hashes = set()
        
    def process_documents(
        self,
        documents: List[Dict[str, Any]],
        deduplicate: bool = True
    ) -> Tuple[List[str], List[Dict[str, Any]], List[str]]:
        """
        Process a list of documents into chunks ready for embedding.
        
        Args:
            documents: List of document dicts with 'content' and 'metadata'
            deduplicate: Whether to remove duplicate content
            
        Returns:
            Tuple of (texts, metadatas, ids) ready for vector store
        """
        all_texts = []
        all_metadatas = []
        all_ids = []
        
        print(f"Processing {len(documents)} documents...")
        
        for doc_idx, document in enumerate(documents):
            content = document.get("content", "")
            base_metadata = document.get("metadata", {})
            
            # Clean and normalize content
            content = self._clean_text(content)
            
            if not content or len(content) < self.min_chunk_size:
                continue
            
            # Check for duplicates
            content_hash = self._hash_content(content)
            if deduplicate and content_hash in self.seen_hashes:
                print(f"  Skipping duplicate document: {base_metadata.get('source_name', 'Unknown')}")
                continue
            
            self.seen_hashes.add(content_hash)
            
            # Chunk the document
            chunks = self._chunk_text(content)
            
            # Process each chunk
            for chunk_idx, chunk in enumerate(chunks):
                if len(chunk) < self.min_chunk_size:
                    continue
                
                # Create chunk metadata
                chunk_metadata = base_metadata.copy()
                chunk_metadata.update({
                    "chunk_index": chunk_idx,
                    "total_chunks": len(chunks),
                    "chunk_size": len(chunk),
                    "processed_at": datetime.utcnow().isoformat(),
                })
                
                # Generate unique ID
                chunk_id = self._generate_chunk_id(
                    content_hash,
                    chunk_idx,
                    base_metadata.get("source_url", "")
                )
                
                all_texts.append(chunk)
                all_metadatas.append(chunk_metadata)
                all_ids.append(chunk_id)
        
        print(f"Processed into {len(all_texts)} chunks")
        return all_texts, all_metadatas, all_ids
    
    def _chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.
        Tries to split at sentence boundaries for better context.
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
        """
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        
        # Split into sentences
        sentences = self._split_sentences(text)
        
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sentence_size = len(sentence)
            
            # If single sentence is larger than chunk_size, split it
            if sentence_size > self.chunk_size:
                # Save current chunk if any
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Split large sentence by character
                for i in range(0, len(sentence), self.chunk_size - self.chunk_overlap):
                    chunk = sentence[i:i + self.chunk_size]
                    if chunk.strip():
                        chunks.append(chunk)
                continue
            
            # Check if adding this sentence exceeds chunk_size
            if current_size + sentence_size > self.chunk_size and current_chunk:
                # Save current chunk
                chunks.append(" ".join(current_chunk))
                
                # Start new chunk with overlap
                # Keep last few sentences for context
                overlap_size = 0
                overlap_sentences = []
                for sent in reversed(current_chunk):
                    if overlap_size + len(sent) <= self.chunk_overlap:
                        overlap_sentences.insert(0, sent)
                        overlap_size += len(sent)
                    else:
                        break
                
                current_chunk = overlap_sentences
                current_size = overlap_size
            
            current_chunk.append(sentence)
            current_size += sentence_size
        
        # Add last chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _split_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences.
        Handles common abbreviations and edge cases.
        """
        # Simple sentence splitter
        # Handle common abbreviations
        text = re.sub(r'(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.', r'\1<PERIOD>', text)
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Restore periods
        sentences = [s.replace('<PERIOD>', '.') for s in sentences]
        
        return [s.strip() for s in sentences if s.strip()]
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize text.
        
        Args:
            text: Raw text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove control characters
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def _hash_content(self, content: str) -> str:
        """Generate hash for content deduplication."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def _generate_chunk_id(
        self,
        content_hash: str,
        chunk_idx: int,
        source_url: str
    ) -> str:
        """Generate unique ID for a chunk."""
        # Create ID from content hash, chunk index, and source
        id_string = f"{content_hash}_{chunk_idx}_{source_url}"
        id_hash = hashlib.md5(id_string.encode('utf-8')).hexdigest()
        return f"jwt_doc_{id_hash[:16]}"
    
    def reset_deduplication(self):
        """Reset the deduplication cache."""
        self.seen_hashes.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get processing statistics."""
        return {
            "unique_documents": len(self.seen_hashes),
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap,
            "min_chunk_size": self.min_chunk_size
        }


class SmartChunker:
    """
    Advanced chunking with semantic awareness.
    Attempts to keep related content together.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_by_headers(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk text by markdown headers for better semantic grouping.
        
        Args:
            text: Text with markdown headers
            metadata: Base metadata
            
        Returns:
            List of chunks with metadata
        """
        chunks = []
        
        # Split by headers
        sections = re.split(r'\n(#{1,6}\s+.+)\n', text)
        
        current_section = ""
        current_title = metadata.get("section_title", "Introduction")
        
        for i, section in enumerate(sections):
            # Check if this is a header
            if re.match(r'^#{1,6}\s+', section):
                # Save previous section
                if current_section.strip():
                    chunks.append({
                        "content": current_section.strip(),
                        "metadata": {
                            **metadata,
                            "subsection_title": current_title,
                            "subsection_index": len(chunks)
                        }
                    })
                
                # Start new section
                current_title = section.strip('#').strip()
                current_section = section + "\n"
            else:
                current_section += section
        
        # Add last section
        if current_section.strip():
            chunks.append({
                "content": current_section.strip(),
                "metadata": {
                    **metadata,
                    "subsection_title": current_title,
                    "subsection_index": len(chunks)
                }
            })
        
        # Further split large sections
        final_chunks = []
        processor = DocumentProcessor(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        
        for chunk in chunks:
            if len(chunk["content"]) > self.chunk_size:
                # Split large section
                sub_chunks = processor._chunk_text(chunk["content"])
                for idx, sub_chunk in enumerate(sub_chunks):
                    final_chunks.append({
                        "content": sub_chunk,
                        "metadata": {
                            **chunk["metadata"],
                            "sub_chunk_index": idx
                        }
                    })
            else:
                final_chunks.append(chunk)
        
        return final_chunks
    
    def chunk_code_blocks(self, text: str) -> List[str]:
        """
        Special handling for code blocks to keep them intact.
        
        Args:
            text: Text with code blocks
            
        Returns:
            List of chunks with code blocks preserved
        """
        # Find code blocks
        code_block_pattern = r'```[\s\S]*?```'
        code_blocks = re.findall(code_block_pattern, text)
        
        # Replace code blocks with placeholders
        for i, block in enumerate(code_blocks):
            text = text.replace(block, f"<CODE_BLOCK_{i}>")
        
        # Chunk the text
        processor = DocumentProcessor(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        chunks = processor._chunk_text(text)
        
        # Restore code blocks
        for i, block in enumerate(code_blocks):
            placeholder = f"<CODE_BLOCK_{i}>"
            chunks = [chunk.replace(placeholder, block) for chunk in chunks]
        
        return chunks

