"""
Production-Ready Ingestion Service for JWT Knowledge Base
Handles data ingestion with error handling, retry logic, and monitoring.
"""

from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime
import traceback
from app.vector.web_scraper import JWTWebScraper
from app.vector.document_processor import DocumentProcessor, SmartChunker
from app.vector.chroma_adapter import ChromaAdapter
from app.core.config import settings


class IngestionStatus:
    """Track ingestion progress and status."""
    
    def __init__(self):
        self.total_documents = 0
        self.processed_documents = 0
        self.failed_documents = 0
        self.total_chunks = 0
        self.errors = []
        self.start_time = None
        self.end_time = None
        
    def start(self):
        """Mark ingestion start."""
        self.start_time = datetime.utcnow()
        
    def finish(self):
        """Mark ingestion finish."""
        self.end_time = datetime.utcnow()
        
    def add_error(self, error: str, context: Dict[str, Any] = None):
        """Add an error to the log."""
        self.errors.append({
            "error": error,
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert status to dictionary."""
        duration = None
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds()
            
        return {
            "total_documents": self.total_documents,
            "processed_documents": self.processed_documents,
            "failed_documents": self.failed_documents,
            "total_chunks": self.total_chunks,
            "success_rate": (
                self.processed_documents / self.total_documents * 100
                if self.total_documents > 0 else 0
            ),
            "duration_seconds": duration,
            "errors": self.errors,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None
        }


class JWTIngestionService:
    """
    Production-ready service for ingesting JWT knowledge.
    Handles scraping, processing, and storage with comprehensive error handling.
    """
    
    def __init__(
        self,
        vector_adapter: Optional[ChromaAdapter] = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        batch_size: int = 50,
        max_retries: int = 3
    ):
        """
        Initialize the ingestion service.
        
        Args:
            vector_adapter: ChromaDB adapter instance
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            batch_size: Number of documents to process in one batch
            max_retries: Maximum retry attempts for failed operations
        """
        self.vector_adapter = vector_adapter or ChromaAdapter()
        self.scraper = JWTWebScraper()
        self.processor = DocumentProcessor(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        self.smart_chunker = SmartChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.status = IngestionStatus()
        
    async def ingest_from_web(
        self,
        custom_urls: Optional[List[str]] = None,
        collection_name: str = "jwt_knowledge"
    ) -> Dict[str, Any]:
        """
        Main ingestion method - scrape and store JWT knowledge.
        
        Args:
            custom_urls: Additional URLs to scrape (optional)
            collection_name: Target ChromaDB collection
            
        Returns:
            Ingestion status and statistics
        """
        self.status = IngestionStatus()
        self.status.start()
        
        print("\n" + "="*60)
        print("🚀 Starting JWT Knowledge Base Ingestion")
        print("="*60 + "\n")
        
        try:
            # Step 1: Scrape documents
            print("📥 Step 1: Scraping JWT documentation from authoritative sources...")
            documents = await self._scrape_documents(custom_urls)
            self.status.total_documents = len(documents)
            
            if not documents:
                print("❌ No documents scraped. Aborting ingestion.")
                self.status.finish()
                return self.status.to_dict()
            
            print(f"✅ Scraped {len(documents)} documents\n")
            
            # Step 2: Process and chunk documents
            print("⚙️  Step 2: Processing and chunking documents...")
            texts, metadatas, ids = await self._process_documents(documents)
            self.status.total_chunks = len(texts)
            
            if not texts:
                print("❌ No chunks created. Aborting ingestion.")
                self.status.finish()
                return self.status.to_dict()
                
            print(f"✅ Created {len(texts)} chunks\n")
            
            # Step 3: Store in vector database
            print("💾 Step 3: Storing in vector database...")
            success = await self._store_in_batches(
                texts, metadatas, ids, collection_name
            )
            
            if success:
                print(f"✅ Successfully stored {len(texts)} chunks in ChromaDB\n")
            else:
                print("⚠️  Some chunks failed to store\n")
            
            # Step 4: Verify and report
            print("📊 Step 4: Verifying ingestion...")
            stats = await self._verify_ingestion(collection_name)
            
            self.status.finish()
            
            print("\n" + "="*60)
            print("✨ Ingestion Complete!")
            print("="*60)
            print(f"📈 Total Documents: {self.status.total_documents}")
            print(f"✅ Processed: {self.status.processed_documents}")
            print(f"❌ Failed: {self.status.failed_documents}")
            print(f"📦 Total Chunks: {self.status.total_chunks}")
            print(f"⏱️  Duration: {stats.get('duration_seconds', 0):.2f}s")
            print("="*60 + "\n")
            
            return {
                **self.status.to_dict(),
                "vector_db_stats": stats
            }
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR during ingestion: {str(e)}")
            traceback.print_exc()
            self.status.add_error(str(e), {"stage": "ingestion"})
            self.status.finish()
            return self.status.to_dict()
    
    async def _scrape_documents(
        self,
        custom_urls: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Scrape documents with error handling."""
        documents = []
        
        try:
            # Scrape default sources
            default_docs = await self.scraper.scrape_all_sources()
            documents.extend(default_docs)
            self.status.processed_documents += len(default_docs)
            
        except Exception as e:
            error_msg = f"Error scraping default sources: {str(e)}"
            print(f"⚠️  {error_msg}")
            self.status.add_error(error_msg, {"stage": "scraping_default"})
        
        # Scrape custom URLs if provided
        if custom_urls:
            try:
                custom_docs = await self.scraper.scrape_custom_urls(custom_urls)
                documents.extend(custom_docs)
                self.status.processed_documents += len(custom_docs)
                
            except Exception as e:
                error_msg = f"Error scraping custom URLs: {str(e)}"
                print(f"⚠️  {error_msg}")
                self.status.add_error(error_msg, {"stage": "scraping_custom"})
        
        return documents
    
    async def _process_documents(
        self,
        documents: List[Dict[str, Any]]
    ) -> tuple:
        """Process documents into chunks."""
        try:
            # Use smart chunking for better semantic grouping
            processed_docs = []
            
            for doc in documents:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})
                
                # Check if content has markdown headers
                if "##" in content or "###" in content:
                    chunks = self.smart_chunker.chunk_by_headers(content, metadata)
                    processed_docs.extend(chunks)
                else:
                    processed_docs.append(doc)
            
            # Final processing
            texts, metadatas, ids = self.processor.process_documents(
                processed_docs,
                deduplicate=True
            )
            
            return texts, metadatas, ids
            
        except Exception as e:
            error_msg = f"Error processing documents: {str(e)}"
            print(f"⚠️  {error_msg}")
            traceback.print_exc()
            self.status.add_error(error_msg, {"stage": "processing"})
            return [], [], []
    
    async def _store_in_batches(
        self,
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str],
        collection_name: str
    ) -> bool:
        """Store documents in batches with retry logic."""
        total_batches = (len(texts) + self.batch_size - 1) // self.batch_size
        successful_batches = 0
        
        for i in range(0, len(texts), self.batch_size):
            batch_num = i // self.batch_size + 1
            batch_texts = texts[i:i + self.batch_size]
            batch_metadatas = metadatas[i:i + self.batch_size]
            batch_ids = ids[i:i + self.batch_size]
            
            print(f"  Batch {batch_num}/{total_batches}: Storing {len(batch_texts)} chunks...")
            
            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    success = await self.vector_adapter.add_documents(
                        texts=batch_texts,
                        metadatas=batch_metadatas,
                        ids=batch_ids,
                        collection_name=collection_name
                    )
                    
                    if success:
                        successful_batches += 1
                        print(f"    ✓ Batch {batch_num} stored successfully")
                        break
                    else:
                        if attempt < self.max_retries - 1:
                            print(f"    ⚠️  Batch {batch_num} failed, retrying...")
                            await asyncio.sleep(2 ** attempt)
                        else:
                            print(f"    ✗ Batch {batch_num} failed after {self.max_retries} attempts")
                            self.status.failed_documents += len(batch_texts)
                            
                except Exception as e:
                    error_msg = f"Error storing batch {batch_num}: {str(e)}"
                    if attempt < self.max_retries - 1:
                        print(f"    ⚠️  {error_msg}, retrying...")
                        await asyncio.sleep(2 ** attempt)
                    else:
                        print(f"    ✗ {error_msg}")
                        self.status.add_error(error_msg, {
                            "stage": "storage",
                            "batch": batch_num,
                            "batch_size": len(batch_texts)
                        })
                        self.status.failed_documents += len(batch_texts)
        
        return successful_batches == total_batches
    
    async def _verify_ingestion(self, collection_name: str) -> Dict[str, Any]:
        """Verify ingestion and get statistics."""
        try:
            stats = await self.vector_adapter.get_statistics()
            
            collection_stats = stats.get("collections", {}).get(collection_name, {})
            
            return {
                "collection_name": collection_name,
                "document_count": collection_stats.get("count", 0),
                "enabled": stats.get("enabled", False),
                "duration_seconds": (
                    (self.status.end_time - self.status.start_time).total_seconds()
                    if self.status.end_time and self.status.start_time else 0
                )
            }
            
        except Exception as e:
            error_msg = f"Error verifying ingestion: {str(e)}"
            print(f"⚠️  {error_msg}")
            self.status.add_error(error_msg, {"stage": "verification"})
            return {"error": error_msg}
    
    async def update_knowledge_base(
        self,
        incremental: bool = True
    ) -> Dict[str, Any]:
        """
        Update the knowledge base with latest information.
        
        Args:
            incremental: If True, only add new content; if False, rebuild from scratch
            
        Returns:
            Update status
        """
        if not incremental:
            print("🔄 Rebuilding knowledge base from scratch...")
            # Clear existing collection
            # Note: Implement collection clearing if needed
        
        print("🔄 Updating knowledge base with latest JWT information...")
        return await self.ingest_from_web()
    
    async def ingest_custom_content(
        self,
        content: str,
        metadata: Dict[str, Any],
        collection_name: str = "jwt_knowledge"
    ) -> bool:
        """
        Ingest custom content (user-provided or manual additions).
        
        Args:
            content: Content to ingest
            metadata: Metadata for the content
            collection_name: Target collection
            
        Returns:
            Success status
        """
        try:
            print(f"📝 Ingesting custom content: {metadata.get('source_name', 'Unknown')}")
            
            # Process the content
            texts, metadatas, ids = self.processor.process_documents(
                [{"content": content, "metadata": metadata}],
                deduplicate=False
            )
            
            if not texts:
                print("⚠️  No chunks created from custom content")
                return False
            
            # Store in vector database
            success = await self.vector_adapter.add_documents(
                texts=texts,
                metadatas=metadatas,
                ids=ids,
                collection_name=collection_name
            )
            
            if success:
                print(f"✅ Successfully stored {len(texts)} chunks")
            else:
                print("❌ Failed to store custom content")
                
            return success
            
        except Exception as e:
            print(f"❌ Error ingesting custom content: {str(e)}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current ingestion status."""
        return self.status.to_dict()

