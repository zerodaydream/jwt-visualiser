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

# Copy requirements first for better caching
COPY requirements.txt /app/

# Upgrade pip to avoid dependency resolution bugs
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies from requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . /app/

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

