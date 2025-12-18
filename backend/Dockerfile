FROM ubuntu:22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy backend code
COPY . /app/

# Install Python dependencies
# Poetry is overkill for deployment - use requirements.txt
RUN pip3 install --no-cache-dir \
    fastapi==0.110.0 \
    uvicorn[standard]==0.27.0 \
    python-dotenv==1.0.0 \
    pyjwt==2.8.0 \
    cryptography==42.0.0 \
    pydantic==2.6.0 \
    pydantic-settings==2.2.0 \
    langchain==0.1.10 \
    langchain-openai==0.0.8 \
    langchain-google-genai==0.0.9 \
    langchain-huggingface==0.0.1 \
    chromadb==0.4.24 \
    tiktoken==0.12.0 \
    sentence-transformers==2.5.0 \
    httpx==0.27.0

# Expose the API port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start script that runs Ollama + pulls model + starts FastAPI
CMD /bin/bash -c " \
    echo '[Startup] Starting Ollama service...' && \
    ollama serve & \
    sleep 5 && \
    echo '[Startup] Pulling phi3:3.8b model (this happens once at first boot)...' && \
    ollama pull phi3:3.8b && \
    echo '[Startup] Model ready. Starting FastAPI...' && \
    cd /app && \
    uvicorn app.main:app --host 0.0.0.0 --port 8080 \
"

