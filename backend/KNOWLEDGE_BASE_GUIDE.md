# JWT Knowledge Base - Ingestion & Retrieval System

## 🎯 Overview

This is a production-ready system for ingesting, storing, and retrieving JWT information from authoritative sources with accurate source tracking and Q&A learning capabilities.

## ✨ Features

### 1. **Web Scraping with Source Attribution**
- Scrapes JWT documentation from authoritative sources (RFCs, JWT.io, OWASP)
- Tracks exact source URLs and section IDs
- Provides content previews for pinpoint accuracy

### 2. **Smart Document Processing**
- Intelligent chunking preserving semantic context
- Deduplication to avoid redundant information
- Special handling for code blocks and markdown structure

### 3. **Vector Storage with ChromaDB**
- Local embeddings (sentence-transformers) - no API costs
- Enhanced metadata with source tracking
- Multiple collections for different content types

### 4. **Q&A Learning System**
- Stores user questions and answers
- Retrieves similar past interactions
- Learns from usage without fine-tuning

### 5. **Production-Ready Ingestion Service**
- Batch processing with error handling
- Retry logic for failed operations
- Progress tracking and detailed statistics

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `.env` file in backend directory:

```bash
# Enable RAG and Q&A Learning
ENABLE_RAG=True
ENABLE_QA_LEARNING=True

# Vector DB Configuration
VECTOR_DB_PATH=./chroma_db

# LLM Configuration (choose one)
LLM_PROVIDER=groq  # or "ollama", "gemini", "openai"
GROQ_API_KEY=your_groq_api_key_here

# Optional: Custom Ollama settings
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:3.8b
```

### Step 3: Run Initial Ingestion

```bash
# Navigate to backend directory
cd backend

# Run ingestion script
python scripts/ingest_jwt_knowledge.py
```

**Expected output:**
- Scrapes 5-7 authoritative sources
- Creates 100-300 document chunks
- Takes 2-5 minutes depending on network speed

### Step 4: Start the API Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Test the System

```bash
# Check health
curl http://localhost:8000/api/v1/knowledge/health

# Search knowledge base
curl -X POST http://localhost:8000/api/v1/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is JWT?",
    "top_k": 3
  }'
```

## 📚 API Endpoints

### Knowledge Base Management

#### 1. Ingest JWT Knowledge (Background)
```http
POST /api/v1/knowledge/ingest
Content-Type: application/json

{
  "custom_urls": ["https://example.com/jwt-guide"],  // optional
  "incremental": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ingestion started in background",
  "status": {
    "started_at": "2025-12-26T10:00:00Z"
  }
}
```

#### 2. Ingest JWT Knowledge (Synchronous)
```http
POST /api/v1/knowledge/ingest/sync
```

Waits for completion. Use for testing or when you need immediate feedback.

#### 3. Ingest Custom Content
```http
POST /api/v1/knowledge/ingest/custom
Content-Type: application/json

{
  "content": "Your custom JWT documentation here...",
  "source_name": "Internal JWT Guide",
  "source_url": "https://internal.company.com/jwt",
  "source_type": "custom",
  "priority": "high"
}
```

#### 4. Search Knowledge Base
```http
POST /api/v1/knowledge/search
Content-Type: application/json

{
  "query": "How to verify JWT signature?",
  "top_k": 5,
  "collection_name": "jwt_knowledge"
}
```

**Response with Source Tracking:**
```json
{
  "success": true,
  "query": "How to verify JWT signature?",
  "total_results": 5,
  "results": [
    {
      "content": "Full content here...",
      "content_preview": "...exact snippet showing where info was taken from...",
      "source": {
        "url": "https://datatracker.ietf.org/doc/html/rfc7519#section-7.2",
        "name": "RFC 7519 - JSON Web Token (JWT)",
        "type": "specification",
        "section": "Validating a JWT",
        "section_id": "section-7.2",
        "priority": "critical"
      },
      "similarity_score": 0.8942,
      "metadata": {
        "scraped_at": "2025-12-26T10:05:00Z",
        "chunk_index": 12,
        "total_chunks": 45
      }
    }
  ]
}
```

#### 5. Get Knowledge Base Status
```http
GET /api/v1/knowledge/status
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "ingestion": {
      "total_documents": 156,
      "processed_documents": 156,
      "failed_documents": 0,
      "total_chunks": 287,
      "success_rate": 100.0
    },
    "vector_database": {
      "enabled": true,
      "collections": {
        "jwt_knowledge": {
          "count": 287,
          "name": "jwt_knowledge"
        },
        "jwt_qa_history": {
          "count": 42,
          "name": "jwt_qa_history"
        }
      }
    },
    "qa_learning": {
      "total_pairs": 42,
      "enabled": true
    }
  }
}
```

#### 6. Get Q&A Learning Insights
```http
GET /api/v1/knowledge/qa/insights
```

#### 7. Clear Old Q&A Pairs
```http
DELETE /api/v1/knowledge/qa/old?days=30
```

### Enhanced Ask Endpoint

The `/ask` endpoint now includes detailed source information:

```http
POST /api/v1/ask
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "question": "Why is the 'none' algorithm dangerous?",
  "history": []
}
```

**Response with Sources:**
```json
{
  "answer": "The 'none' algorithm is dangerous because...",
  "context_used": ["legacy format for backward compatibility"],
  "sources": [
    {
      "content": "Full relevant content...",
      "content_preview": "...critical security warning about 'none' algorithm...",
      "source": {
        "url": "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#section-3",
        "name": "OWASP - JWT Cheat Sheet",
        "type": "security",
        "section": "Algorithm Selection",
        "priority": "high"
      },
      "similarity_score": 0.9156
    }
  ]
}
```

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Scraper                              │
│  - Fetches from RFCs, JWT.io, OWASP                         │
│  - Tracks source URLs and sections                          │
│  - Handles retries and errors                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Document Processor                            │
│  - Chunks text intelligently (1000 chars, 200 overlap)     │
│  - Deduplicates content                                     │
│  - Preserves code blocks and structure                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                ChromaDB Adapter                             │
│  - Local embeddings (sentence-transformers)                │
│  - Enhanced metadata with previews                         │
│  - Multiple collections support                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Ingestion Service                              │
│  - Batch processing                                         │
│  - Error handling & retries                                │
│  - Progress tracking                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Routes                                 │
│  - /knowledge/* endpoints                                   │
│  - Enhanced /ask with sources                              │
│  - Q&A learning integration                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Ingestion:**
   - Scrape → Process → Chunk → Embed → Store

2. **Retrieval:**
   - Query → Embed → Search → Rank → Format with Sources

3. **Q&A Learning:**
   - User Question → Generate Answer → Store Q&A → Future Retrieval

## 📊 Monitoring

### Check Ingestion Status

```bash
python scripts/ingest_jwt_knowledge.py --dry-run
```

### View Statistics

```bash
curl http://localhost:8000/api/v1/knowledge/status | jq
```

### Test Retrieval

```bash
curl -X POST http://localhost:8000/api/v1/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "top_k": 1}' | jq
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_RAG` | `False` | Enable RAG system |
| `ENABLE_QA_LEARNING` | `False` | Enable Q&A learning |
| `VECTOR_DB_PATH` | `./chroma_db` | ChromaDB storage path |
| `LLM_PROVIDER` | `groq` | LLM provider |

### Ingestion Parameters

```python
JWTIngestionService(
    chunk_size=1000,        # Characters per chunk
    chunk_overlap=200,      # Overlap for context
    batch_size=50,          # Chunks per batch
    max_retries=3           # Retry attempts
)
```

## 🎨 Customization

### Add Custom Sources

Edit `backend/app/vector/web_scraper.py`:

```python
JWT_SOURCES = [
    # Add your custom source
    {
        "url": "https://your-domain.com/jwt-docs",
        "type": "documentation",
        "source_name": "Your Custom JWT Guide",
        "priority": "high"
    }
]
```

### Adjust Chunk Size

Edit `backend/scripts/ingest_jwt_knowledge.py`:

```python
ingestion_service = JWTIngestionService(
    chunk_size=1500,  # Larger chunks
    chunk_overlap=300  # More overlap
)
```

## 🐛 Troubleshooting

### Issue: "RAG is disabled"
**Solution:** Set `ENABLE_RAG=True` in `.env` file

### Issue: "Embedding model failed to load"
**Solution:** 
```bash
pip install sentence-transformers
```

### Issue: "No documents scraped"
**Solution:** Check internet connection and firewall settings

### Issue: Slow ingestion
**Solution:** Reduce `batch_size` or `chunk_size`

## 📈 Performance

- **Ingestion:** 2-5 minutes for default sources
- **Query:** < 100ms for vector search
- **Storage:** ~50MB for 300 chunks with embeddings
- **Memory:** ~500MB during ingestion, ~200MB at runtime

## 🔒 Security

- All sources are from authoritative, trusted domains
- No external API calls during retrieval (local embeddings)
- Rate limiting on all endpoints
- Input validation on custom content ingestion

## 📝 License

See main project LICENSE file.

## 🤝 Contributing

1. Add new authoritative sources to `web_scraper.py`
2. Improve chunking strategies in `document_processor.py`
3. Enhance source attribution logic
4. Add more comprehensive error handling

## 🎓 Learn More

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [JWT Specifications](https://datatracker.ietf.org/doc/html/rfc7519)

