from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.core.config import settings
import asyncio
import httpx
from contextlib import asynccontextmanager

# Warm up LLM on startup
async def warmup_llm():
    """
    Warm up the LLM model by sending a simple test query.
    This loads the model into memory and reduces first-query latency.
    """
    if settings.LLM_PROVIDER != "ollama":
        print("[Warmup] Skipping LLM warmup (not using Ollama)")
        return
    
    try:
        print(f"[Warmup] Warming up Ollama model: {settings.OLLAMA_MODEL}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": "Hello",
                    "stream": False,
                    "options": {
                        "num_predict": 10,  # Just a few tokens
                    }
                }
            )
            if response.status_code == 200:
                print(f"[Warmup] ✓ Model {settings.OLLAMA_MODEL} is loaded and ready")
            else:
                print(f"[Warmup] ⚠ Model warmup returned status {response.status_code}")
    except Exception as e:
        print(f"[Warmup] ⚠ LLM warmup failed (model will load on first query): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Warm up LLM
    print("[Startup] Initializing...")
    await warmup_llm()
    print("[Startup] ✓ Backend ready")
    
    yield
    
    # Shutdown
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
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "rag_enabled": settings.ENABLE_RAG
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
