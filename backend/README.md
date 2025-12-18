# 🔐 JWT Visualiser Backend

> FastAPI-based backend service providing JWT analysis, generation, and AI-powered insights with RAG (Retrieval-Augmented Generation) capabilities.

## 🌟 Features

- ✅ **JWT Processing**: Decode, validate, and generate JWTs with multiple algorithms
- 🤖 **AI Integration**: Google Gemini, OpenAI, and **Local Ollama** support (free & private!)
- 🏠 **Local LLM Option**: Run completely offline with Ollama (no API costs)
- 📚 **RAG System**: Vector database powered knowledge retrieval
- 🔄 **WebSocket Support**: Real-time streaming responses
- 📊 **Comprehensive Analysis**: Security checks, expiration validation, claims extraction
- 🚀 **High Performance**: Async/await architecture with Uvicorn
- 📝 **Auto Documentation**: Interactive API docs with Swagger UI
- 🛡️ **Type Safety**: Pydantic models for request/response validation

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [LLM Integration](#llm-integration)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

```
backend/
├── app/
│   ├── api/
│   │   ├── routes.py       # API endpoints
│   │   └── schemas.py      # Pydantic models
│   ├── core/
│   │   └── config.py       # Configuration management
│   ├── jwt/
│   │   ├── analysis.py     # JWT analysis logic
│   │   ├── decoder.py      # Token decoding
│   │   └── generator.py    # Token generation
│   ├── llm/
│   │   ├── base.py         # LLM interface
│   │   ├── factory.py      # LLM provider factory
│   │   ├── openai_adapter.py   # OpenAI integration
│   │   ├── gemini_adapter.py   # Google Gemini integration
│   │   └── mock_adapter.py     # Mock for testing
│   ├── vector/
│   │   ├── base.py         # Vector DB interface
│   │   └── chroma_adapter.py   # ChromaDB implementation
│   └── main.py            # FastAPI application
├── chroma_db/             # Vector database storage
├── pyproject.toml         # Poetry dependencies
└── README.md
```

## 📦 Installation

### Prerequisites

- Python 3.11 or higher
- Poetry (recommended) or pip
- Virtual environment (recommended)

### Using Poetry (Recommended)

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Navigate to backend directory
cd backend

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### Using pip

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt  # If you have requirements.txt
# OR
pip install fastapi uvicorn pyjwt cryptography pydantic langchain chromadb
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# ======================
# LLM Configuration
# ======================
# Set to false to use local Ollama instead of paid APIs (Gemini/OpenAI)
USE_PAID_LLM=true

# Paid LLM API Keys (only used when USE_PAID_LLM=true)
GOOGLE_API_KEY=your-google-api-key-here
OPENAI_API_KEY=sk-...

# ======================
# Ollama Configuration (Local LLM)
# ======================
# Only used when USE_PAID_LLM=false
# Install Ollama: https://ollama.ai/download
# Pull model: ollama pull phi3:3.8b
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:3.8b  # Recommended: phi3:3.8b (best for technical), llama3.2:3b, gemma2:2b

# ======================
# Server Configuration
# ======================
HOST=0.0.0.0
PORT=8000
RELOAD=true
LOG_LEVEL=info

# ======================
# CORS Settings
# ======================
BACKEND_CORS_ORIGINS=*  # Or comma-separated: http://localhost:3000,http://localhost:3001

# ======================
# Vector Database & RAG
# ======================
VECTOR_DB_PATH=./chroma_db
ENABLE_RAG=false  # Set to true to enable RAG with embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ======================
# JWT Configuration
# ======================
DEFAULT_JWT_SECRET=your-secret-key-here
DEFAULT_ALGORITHM=HS256

# ======================
# RAG Configuration
# ======================
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
```

### Configuration Class

The `app/core/config.py` module handles all configuration:

```python
from app.core.config import get_settings

settings = get_settings()
api_key = settings.openai_api_key
```

## 🚀 Running the Application

### Development Mode

**First Time Setup (if using Ollama):**

1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

2. The backend will automatically download the model on first start!

**Start the server:**

```bash
# Using Poetry
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The startup will show:
```
🚀 Starting JWT Visualiser Backend
🔍 Ollama Startup Health Check
💻 Apple Silicon (Apple M2) - Metal GPU acceleration enabled
✅ Model 'phi3:3.8b' is already downloaded
```

If the model isn't downloaded, it will automatically download it (2-4 minutes).

### Production Mode

```bash
# Single worker
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Multiple workers (recommended)
poetry run gunicorn app.main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

### Docker

```bash
# Build image
docker build -t jwt-backend .

# Run container
docker run -p 8000:8000 --env-file .env jwt-backend
```

### Access Points

- **Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### JWT Operations

#### Decode JWT
```http
POST /api/v1/decode
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "header": {"alg": "HS256", "typ": "JWT"},
  "payload": {"sub": "1234567890", "name": "John Doe"},
  "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "is_valid": true,
  "algorithm": "HS256",
  "issued_at": "2024-01-01T00:00:00Z"
}
```

#### Generate JWT
```http
POST /api/v1/generate
Content-Type: application/json

{
  "payload": {
    "sub": "1234567890",
    "name": "John Doe",
    "admin": true
  },
  "secret": "your-secret-key",
  "algorithm": "HS256",
  "expires_in": 3600
}
```

#### Analyze JWT
```http
POST /api/v1/analyze
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "structure": {
    "is_valid": true,
    "parts": 3,
    "header_valid": true,
    "payload_valid": true
  },
  "security": {
    "algorithm": "HS256",
    "is_expired": false,
    "has_nbf": false,
    "has_exp": true
  },
  "claims": {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022,
    "exp": 1516242622
  },
  "recommendations": [
    "Consider using RS256 for better security",
    "Add 'nbf' claim for activation time"
  ]
}
```

### AI Chat (WebSocket)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/ask/ws');

// Send query
ws.send(JSON.stringify({
  type: 'query',
  message: 'What is a JWT?',
  token: 'optional-jwt-token-for-context'
}));

// Receive streaming response
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.content);
};
```

**Message Types:**
- `connection`: Initial connection confirmation
- `auth`: Token validation status
- `rag`: Document retrieval status
- `stream_start`: Response streaming begins
- `chunk`: Character chunks
- `complete`: Response finished
- `error`: Error occurred

### Health & Status

#### Health Check
```http
GET /health
```

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "llm_provider": "openai",
  "vector_db": "chromadb"
}
```

## 🤖 LLM Integration

### Supported Providers

#### 🏠 Ollama (Local - Recommended for Free/Private Use)
```env
# .env
USE_PAID_LLM=false
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

**Features:**
- ✅ **Free**: No API costs
- ✅ **Private**: Data never leaves your machine
- ✅ **Offline**: Works without internet
- ✅ **Fast**: Low latency local inference
- ✅ **Lightweight**: 3-4GB models available

**Setup:**
```bash
# Install Ollama
brew install ollama  # macOS
# OR visit https://ollama.ai/download

# Start Ollama server (in a separate terminal)
ollama serve
```

**Automatic Model Download:**

The backend will **automatically download** the model on first startup! No manual pulling needed.

Alternatively, you can pre-download manually or use the setup script:

```bash
# Option 1: Manual download
ollama pull phi3:3.8b

# Option 2: Use setup script
cd backend
python scripts/setup_ollama.py
```

**Recommended Models:**
- `phi3:3.8b` - **Best for JWT/technical Q&A** (3-4GB RAM) ⭐
- `llama3.2:3b` - Faster, general purpose (3-4GB RAM)
- `gemma2:2b` - Lightweight option (2-3GB RAM)

📖 **[Complete Ollama Setup Guide](./OLLAMA_SETUP.md)**

#### ☁️ Google Gemini (Paid API)
```env
# .env
USE_PAID_LLM=true
GOOGLE_API_KEY=your-api-key
```

**Features:**
- Gemini 2.5 Flash model
- Streaming responses
- Fast and cost-effective
- High-quality responses

#### 🤖 OpenAI GPT (Paid API)
```env
# .env
USE_PAID_LLM=true
OPENAI_API_KEY=sk-...
```

**Features:**
- GPT-4 Turbo model
- Function calling support
- Premium quality responses

#### 🧪 Mock Provider (Testing)
```env
# .env
USE_PAID_LLM=true
# Don't set any API keys
```

**Use Cases:**
- Development without API costs
- Testing
- Demo purposes

### Learning from User Interactions

**Important**: Ollama models do NOT automatically train during runtime.

However, you can enable **RAG-based learning** to store Q&A pairs:

```env
# Enable RAG for knowledge retrieval
ENABLE_RAG=true

# Enable Q&A storage (learns from interactions)
ENABLE_QA_LEARNING=true
```

This provides a form of "learning" where:
- Every Q&A pair is stored in the vector database
- Similar past Q&A pairs are retrieved for future questions
- The system provides more consistent, context-aware responses
- No model training required - works with any LLM!

📖 **[Complete Learning & Training Guide](./LEARNING_GUIDE.md)**

### Custom LLM Adapter

To add a new LLM provider:

1. Create adapter in `app/llm/`:
```python
# app/llm/custom_adapter.py
from app.llm.base import BaseLLMAdapter

class CustomLLMAdapter(BaseLLMAdapter):
    async def generate_response(self, prompt: str, context: str):
        # Your implementation
        pass
    
    async def generate_streaming_response(self, prompt: str, context: str):
        # Streaming implementation
        pass
```

2. Register in factory:
```python
# app/llm/factory.py
from app.llm.custom_adapter import CustomLLMAdapter

def get_llm_adapter():
    if settings.llm_provider == "custom":
        return CustomLLMAdapter()
```

## 🗄️ Vector Database

### ChromaDB Configuration

The vector database stores JWT documentation for RAG:

```python
# Default configuration
CHROMA_PERSIST_DIR=./chroma_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
COLLECTION_NAME=jwt_knowledge
```

### Adding Documents

```python
from app.vector.chroma_adapter import ChromaAdapter

vector_db = ChromaAdapter()

# Add documents
vector_db.add_documents(
    texts=["JWT is a compact token format..."],
    metadatas=[{"source": "docs", "topic": "jwt"}]
)

# Query
results = vector_db.query("What is JWT?", top_k=5)
```

### Initializing Knowledge Base

```bash
# Run initialization script (if provided)
poetry run python scripts/init_vectordb.py
```

## 🧪 Testing

### Run All Tests

```bash
poetry run pytest
```

### Run Specific Tests

```bash
# Test JWT operations
poetry run pytest tests/test_jwt.py

# Test API endpoints
poetry run pytest tests/test_api.py

# Test with coverage
poetry run pytest --cov=app tests/
```

### Test Coverage

```bash
poetry run pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

## 🚢 Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy application
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build and Run:**
```bash
docker build -t jwt-backend .
docker run -p 8000:8000 --env-file .env jwt-backend
```

### Railway / Render Deployment

1. Connect your repository
2. Set environment variables
3. Set build command: `poetry install --no-dev`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### AWS EC2 / DigitalOcean

```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip

# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Clone and setup
git clone your-repo
cd backend
poetry install --no-dev

# Run with systemd
sudo systemctl start jwt-backend
```

### Environment Variables in Production

```bash
# Required
export LLM_PROVIDER=openai
export OPENAI_API_KEY=your-key

# Recommended
export LOG_LEVEL=warning
export RELOAD=false
export WORKERS=4
```

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
```
Error: WebSocket connection failed (1006)
```
**Solution:** Ensure backend is running and CORS is properly configured.

#### Vector DB Initialization Error
```
Error: Cannot initialize ChromaDB
```
**Solution:** Delete `chroma_db` folder and restart.

#### LLM API Key Error
```
Error: Invalid API key
```
**Solution:** Check `.env` file and ensure API key is valid.

#### Import Errors
```
ModuleNotFoundError: No module named 'app'
```
**Solution:** Ensure you're in the correct directory and virtual environment is activated.

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
poetry run uvicorn app.main:app --reload --log-level debug
```

### Performance Issues

1. **Slow Response Times**
   - Increase worker count
   - Use Redis for caching
   - Optimize vector database queries

2. **High Memory Usage**
   - Reduce embedding model size
   - Clear ChromaDB cache
   - Limit concurrent WebSocket connections

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [LangChain Documentation](https://python.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)

## 🤝 Contributing

See main [README.md](../README.md) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) file.

## 📧 Support

For issues specific to the backend:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API documentation at `/docs`
3. Open an issue on GitHub
4. Email: dhanush.atwork@gmail.com

---

Made with ⚡ FastAPI and ❤️ Python
