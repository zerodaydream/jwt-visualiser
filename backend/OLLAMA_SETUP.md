# Ollama Setup Guide

This guide will help you set up Ollama for local LLM inference, allowing you to use JWT Visualiser without paid API keys.

## What is Ollama?

Ollama is a tool that allows you to run large language models locally on your machine. It's free, open-source, and works offline.

## Benefits of Using Ollama

- ✅ **Free**: No API costs
- ✅ **Private**: Your data never leaves your machine
- ✅ **Offline**: Works without internet connection
- ✅ **Fast**: Low latency for local inference
- ✅ **Lightweight**: Models optimized for consumer hardware (3-4GB RAM)

## Installation

### macOS

```bash
# Download and install from website
# Visit: https://ollama.ai/download

# Or use Homebrew
brew install ollama
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

Download the installer from [https://ollama.ai/download](https://ollama.ai/download)

## Quick Start

### 1. Start Ollama Server

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434` (default port).

### 2. Model Download (Automatic! 🎉)

**Good news**: The JWT Visualiser backend **automatically downloads** the model on first startup!

Just start the backend and it will:
- ✅ Check if Ollama is running
- ✅ Check if the model exists
- ✅ Download it automatically if missing
- ✅ Show real-time download progress

**Manual download (optional):**

If you prefer to download beforehand:

```bash
ollama pull phi3:3.8b
```

Or use the setup script:

```bash
cd backend
python scripts/setup_ollama.py
```

**Other recommended models:**

| Model | Size | RAM Required | Best For |
|-------|------|--------------|----------|
| phi3:3.8b | 2.3GB | 4GB | **Technical Q&A (recommended for JWT)** |
| llama3.2:3b | 2GB | 3-4GB | General purpose, fast |
| gemma2:2b | 1.6GB | 2-3GB | Lightweight, quick responses |
| mistral:7b | 4GB | 6-8GB | High quality, slower |

### 3. Configure JWT Visualiser

Update your backend `.env` file:

```bash
# Disable paid LLMs
USE_PAID_LLM=false

# Ollama configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:3.8b
```

### 4. Verify Setup

Test the Ollama installation:

```bash
# Test the model
ollama run phi3:3.8b "What is a JWT token?"

# List installed models
ollama list
```

### 5. Start Your Backend

```bash
cd backend
poetry install  # Install dependencies (includes httpx for Ollama)
poetry run uvicorn app.main:app --reload
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_PAID_LLM` | `true` | Set to `false` to use Ollama |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model name to use |

### Model Selection Tips

**For low-end machines (8GB RAM or less):**
- Use `gemma2:2b`

**For mid-range machines (16GB RAM) - Recommended:**
- Use `phi3:3.8b` (best for technical content like JWT)
- Or `llama3.2:3b` (faster, more general)

**For high-end machines (32GB+ RAM):**
- Use `mistral:7b` or `llama3.1:8b`

## Usage

Once configured, the JWT Visualiser will automatically use Ollama for:
- JWT token analysis
- Security recommendations
- Question answering about JWT claims
- Conversational context understanding

The experience is nearly identical to using paid APIs, but:
- **Fully private** - no data sent to external servers
- **No rate limits** - use as much as you want
- **No costs** - completely free

## Troubleshooting

### Error: "Cannot connect to Ollama server"

**Solution:**
1. Make sure Ollama is running: `ollama serve`
2. Check if port 11434 is available: `lsof -i :11434`
3. Verify OLLAMA_HOST in .env matches the server URL

### Error: "Model not found"

**Solution:**
1. Pull the model: `ollama pull phi3:3.8b`
2. Verify it's installed: `ollama list`
3. Make sure OLLAMA_MODEL in .env matches exactly

### Slow Response Times

**Solutions:**
1. Use a smaller model (e.g., `gemma2:2b`)
2. Ensure no other heavy processes are running
3. Consider upgrading RAM or using paid APIs for faster responses

### Model Takes Long to Load First Time

This is normal. The first request loads the model into memory (30-60 seconds). Subsequent requests are much faster.

## Advanced Configuration

### Using a Remote Ollama Server

You can run Ollama on a different machine or server:

```bash
# On the server
OLLAMA_HOST=0.0.0.0 ollama serve

# In your .env
OLLAMA_HOST=http://192.168.1.100:11434
```

### Custom Model Configuration

You can create custom model configurations with Modelfiles:

```bash
# Create a Modelfile
cat > Modelfile << EOF
FROM phi3:3.8b
PARAMETER temperature 0.3
PARAMETER num_predict 512
SYSTEM You are a JWT security expert...
EOF

# Create custom model
ollama create jwt-expert -f Modelfile

# Use in .env
OLLAMA_MODEL=jwt-expert
```

## Fine-tuning and Training

While Ollama models support few-shot learning (learning from examples in the prompt), full fine-tuning requires:

1. Export the model weights
2. Use tools like `llama.cpp` or `transformers`
3. Fine-tune on your custom dataset
4. Import back to Ollama

For most use cases, the pre-trained models work excellently without fine-tuning.

## Performance Comparison

| Metric | Ollama (Local) | Gemini 2.5 Flash | OpenAI GPT-4 |
|--------|---------------|------------------|--------------|
| Cost | Free | ~$0.0002/req | ~$0.002/req |
| Latency | 1-3s | 0.5-1s | 1-2s |
| Privacy | 100% Private | Data sent to Google | Data sent to OpenAI |
| Offline | ✅ Yes | ❌ No | ❌ No |
| Quality | Good | Excellent | Excellent |

## Resources

- [Ollama Official Website](https://ollama.ai/)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Model Library](https://ollama.ai/library)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Support

If you encounter issues:
1. Check the Ollama logs: `journalctl -u ollama` (Linux) or Console.app (macOS)
2. Visit [Ollama GitHub Issues](https://github.com/ollama/ollama/issues)
3. Join the [Ollama Discord](https://discord.gg/ollama)

