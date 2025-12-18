from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.core.config import settings
from app.llm.session_manager import get_session_manager
import asyncio
from contextlib import asynccontextmanager

# Background task for cleaning up old sessions
async def cleanup_old_sessions():
    """Background task to clean up stale sessions every 30 minutes."""
    session_manager = get_session_manager()
    while True:
        await asyncio.sleep(1800)  # 30 minutes
        try:
            session_manager.cleanup_old_sessions(max_age_minutes=60)
        except Exception as e:
            print(f"[SessionCleanup] Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Start background cleanup task
    cleanup_task = asyncio.create_task(cleanup_old_sessions())
    print("[Startup] Session cleanup task started")
    
    yield
    
    # Shutdown: Cancel cleanup task and clear all sessions
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    # Clean up all active sessions
    session_manager = get_session_manager()
    active_count = session_manager.get_active_session_count()
    if active_count > 0:
        print(f"[Shutdown] Cleaning up {active_count} active sessions")
        for session_id in list(session_manager.sessions.keys()):
            session_manager.delete_session(session_id)
    
    print("[Shutdown] Application shutdown complete")

app = FastAPI(
    title="JWT Visualizer API",
    description="A secure JWT decoder and analyzer with AI-powered insights",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "JWT Visualizer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    session_manager = get_session_manager()
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "rag_enabled": settings.ENABLE_RAG,
        "active_sessions": session_manager.get_active_session_count()
    }

@app.get("/api/v1/sessions/info")
async def get_sessions_info():
    """Get information about all active sessions (for monitoring/debugging)."""
    session_manager = get_session_manager()
    sessions_info = []
    
    for session_id in session_manager.sessions.keys():
        info = session_manager.get_session_info(session_id)
        if info:
            sessions_info.append(info)
    
    return {
        "active_sessions": len(sessions_info),
        "sessions": sessions_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
