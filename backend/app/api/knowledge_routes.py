"""
Additional API Routes for Knowledge Base Ingestion and Management
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.vector.ingestion_service import JWTIngestionService
from app.vector.chroma_adapter import ChromaAdapter
from app.vector.qa_store import QAStore
from app.core.config import settings

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

# Initialize services
vector_adapter = ChromaAdapter()
ingestion_service = JWTIngestionService(vector_adapter=vector_adapter)
qa_store = QAStore(vector_adapter=vector_adapter)


# Pydantic Models
class IngestionRequest(BaseModel):
    custom_urls: Optional[List[str]] = Field(default=None, description="Additional URLs to scrape")
    incremental: bool = Field(default=True, description="Incremental update or full rebuild")


class IngestionResponse(BaseModel):
    success: bool
    message: str
    status: Dict[str, Any]


class CustomContentRequest(BaseModel):
    content: str = Field(..., description="Content to ingest")
    source_name: str = Field(..., description="Name of the source")
    source_url: str = Field(..., description="URL of the source")
    source_type: str = Field(default="custom", description="Type of source")
    priority: str = Field(default="medium", description="Priority level")


class QueryRequest(BaseModel):
    query: str = Field(..., description="Search query")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results")
    collection_name: str = Field(default="jwt_knowledge", description="Collection to search")


class QueryResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    query: str
    total_results: int


class StatsResponse(BaseModel):
    success: bool
    statistics: Dict[str, Any]


# API Endpoints

@router.post("/ingest", response_model=IngestionResponse)
async def ingest_jwt_knowledge(
    request: IngestionRequest,
    background_tasks: BackgroundTasks
):
    """
    Ingest JWT knowledge from authoritative sources.
    This endpoint triggers web scraping, processing, and storage.
    
    **Note:** This is a background task and may take several minutes.
    """
    if not settings.ENABLE_RAG:
        raise HTTPException(
            status_code=400,
            detail="RAG is disabled. Set ENABLE_RAG=True in environment to use this feature."
        )
    
    try:
        # Run ingestion in background
        async def run_ingestion():
            if request.incremental:
                await ingestion_service.ingest_from_web(custom_urls=request.custom_urls)
            else:
                await ingestion_service.update_knowledge_base(incremental=False)
        
        background_tasks.add_task(run_ingestion)
        
        return IngestionResponse(
            success=True,
            message="Ingestion started in background. Check /knowledge/status for progress.",
            status={"started_at": datetime.utcnow().isoformat()}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/ingest/sync", response_model=IngestionResponse)
async def ingest_jwt_knowledge_sync(request: IngestionRequest):
    """
    Synchronously ingest JWT knowledge (waits for completion).
    Use this for testing or when you need immediate feedback.
    
    **Warning:** This may take several minutes to complete.
    """
    if not settings.ENABLE_RAG:
        raise HTTPException(
            status_code=400,
            detail="RAG is disabled. Set ENABLE_RAG=True in environment to use this feature."
        )
    
    try:
        status = await ingestion_service.ingest_from_web(
            custom_urls=request.custom_urls
        )
        
        return IngestionResponse(
            success=status.get("processed_documents", 0) > 0,
            message=f"Ingested {status.get('total_chunks', 0)} chunks from {status.get('processed_documents', 0)} documents",
            status=status
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/ingest/custom", response_model=IngestionResponse)
async def ingest_custom_content(request: CustomContentRequest):
    """
    Ingest custom content into the knowledge base.
    Useful for adding organization-specific JWT documentation.
    """
    if not settings.ENABLE_RAG:
        raise HTTPException(
            status_code=400,
            detail="RAG is disabled. Set ENABLE_RAG=True in environment to use this feature."
        )
    
    try:
        metadata = {
            "source_name": request.source_name,
            "source_url": request.source_url,
            "source_type": request.source_type,
            "priority": request.priority,
            "scraped_at": datetime.utcnow().isoformat(),
            "document_type": "jwt_knowledge",
            "custom_content": True
        }
        
        success = await ingestion_service.ingest_custom_content(
            content=request.content,
            metadata=metadata
        )
        
        if success:
            return IngestionResponse(
                success=True,
                message="Custom content ingested successfully",
                status={"ingested_at": datetime.utcnow().isoformat()}
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to ingest custom content")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/search", response_model=QueryResponse)
async def search_knowledge_base(request: QueryRequest):
    """
    Search the JWT knowledge base with detailed source attribution.
    Returns results with content previews and exact source URLs.
    """
    if not settings.ENABLE_RAG:
        raise HTTPException(
            status_code=400,
            detail="RAG is disabled. Set ENABLE_RAG=True in environment to use this feature."
        )
    
    try:
        results = await vector_adapter.query(
            query_text=request.query,
            top_k=request.top_k,
            collection_name=request.collection_name,
            include_distance=True
        )
        
        # Format results with enhanced source information
        formatted_results = []
        for result in results:
            formatted_results.append({
                "content": result.get("content", ""),
                "content_preview": result.get("content_preview", ""),
                "source": result.get("source", {}),
                "similarity_score": result.get("similarity_score", 0),
                "metadata": {
                    k: v for k, v in result.get("metadata", {}).items()
                    if k not in ["content_preview", "content_length"]  # Avoid duplication
                }
            })
        
        return QueryResponse(
            success=True,
            results=formatted_results,
            query=request.query,
            total_results=len(formatted_results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/status", response_model=StatsResponse)
async def get_knowledge_base_status():
    """
    Get current status and statistics of the knowledge base.
    """
    try:
        # Get ingestion status
        ingestion_status = ingestion_service.get_status()
        
        # Get vector DB stats
        vector_stats = await vector_adapter.get_statistics()
        
        # Get QA learning stats
        qa_stats = await qa_store.get_qa_statistics()
        
        statistics = {
            "ingestion": ingestion_status,
            "vector_database": vector_stats,
            "qa_learning": qa_stats,
            "rag_enabled": settings.ENABLE_RAG,
            "qa_learning_enabled": settings.ENABLE_QA_LEARNING,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return StatsResponse(
            success=True,
            statistics=statistics
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/qa/insights", response_model=StatsResponse)
async def get_qa_learning_insights():
    """
    Get insights about what the system has learned from Q&A interactions.
    """
    if not settings.ENABLE_QA_LEARNING:
        raise HTTPException(
            status_code=400,
            detail="Q&A learning is disabled. Set ENABLE_QA_LEARNING=True in environment."
        )
    
    try:
        insights = await qa_store.get_learning_insights()
        
        return StatsResponse(
            success=True,
            statistics=insights
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")


@router.delete("/qa/old")
async def clear_old_qa_pairs(days: int = 30):
    """
    Clear Q&A pairs older than specified days.
    
    Args:
        days: Number of days to keep (default: 30)
    """
    if not settings.ENABLE_QA_LEARNING:
        raise HTTPException(
            status_code=400,
            detail="Q&A learning is disabled."
        )
    
    try:
        deleted_count = await qa_store.clear_old_qa_pairs(days=days)
        
        return {
            "success": True,
            "message": f"Cleared {deleted_count} Q&A pairs older than {days} days",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear old Q&A: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the knowledge base system.
    """
    health_status = {
        "status": "healthy",
        "rag_enabled": settings.ENABLE_RAG,
        "qa_learning_enabled": settings.ENABLE_QA_LEARNING,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check if vector store is accessible
    try:
        if settings.ENABLE_RAG:
            stats = await vector_adapter.get_statistics()
            health_status["vector_db"] = "connected"
            health_status["collections"] = list(stats.get("collections", {}).keys())
        else:
            health_status["vector_db"] = "disabled"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["vector_db"] = f"error: {str(e)}"
    
    return health_status

