# 🚀 Deployment Guide - Production-Ready, Free Tier Architecture

This guide will help you deploy your JWT Visualizer to production using the best free-tier options available.

## 📋 Architecture Overview

```
Browser
  ↓
Next.js (Static/Edge) → Cloudflare Pages (FREE, no cold starts)
  ↓
FastAPI + Ollama → Fly.io (FREE tier with Docker support)
```

### Why This Architecture?

- ✅ **Frontend (Cloudflare Pages)**: Instant load, global CDN, no cold starts
- ✅ **Backend (Fly.io)**: Runs Docker containers, supports Ollama, free CPU allowance
- ✅ **Single Container**: FastAPI + Ollama together = no network latency between services
- ✅ **Model Preloading**: phi3:3.8b downloads at build time, warms up on startup

---

## 🎯 Part 1: Deploy Frontend (Next.js → Cloudflare Pages)

### Prerequisites
- GitHub account
- Cloudflare account (free)

### Steps

#### 1. Build the Static Export

```bash
cd frontend
npm install
npm run build
```

This creates an optimized static export in the `out/` directory.

#### 2. Deploy to Cloudflare Pages

**Option A: Via GitHub (Recommended)**

1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click "Create a project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/out`
   - **Environment variables**:
     - `NEXT_PUBLIC_API_URL` = `https://jwt-visualiser-api.fly.dev` (update after backend deployment)

**Option B: Direct Upload**

```bash
cd frontend
npx wrangler pages deploy out --project-name=jwt-visualiser
```

#### 3. Update API URL

After deploying the backend (Part 2), update the environment variable:
- In Cloudflare Pages dashboard → Settings → Environment Variables
- Set `NEXT_PUBLIC_API_URL` to your Fly.io backend URL

---

## 🐳 Part 2: Deploy Backend (FastAPI + Ollama → Fly.io)

### Prerequisites
- [Fly.io CLI installed](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io account (free tier available)

### Steps

#### 1. Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

#### 2. Login to Fly.io

```bash
fly auth login
```

#### 3. Launch Your App

```bash
cd backend
fly launch
```

**During the interactive setup:**
- App name: `jwt-visualiser-api` (or your preferred name)
- Region: Choose closest to your users (e.g., `sjc` for San Jose)
- PostgreSQL: **No** (we don't need it)
- Redis: **No** (we don't need it)
- Deploy now: **Yes**

This will:
- Create a `fly.toml` configuration file (already provided)
- Build your Docker image
- Deploy to Fly.io

#### 4. Monitor Deployment

```bash
fly logs
```

**Expected output:**
```
[Startup] Starting Ollama service...
[Startup] Pulling phi3:3.8b model...
[Startup] Model ready. Starting FastAPI...
[Startup] Warming up Ollama model: phi3:3.8b
[Startup] ✓ Model phi3:3.8b is loaded and ready
[Startup] ✓ Backend ready
```

#### 5. Test Your Backend

```bash
fly status
fly open /health
```

Or visit: `https://jwt-visualiser-api.fly.dev/health`

Expected response:
```json
{
  "status": "healthy",
  "llm_provider": "ollama",
  "rag_enabled": false,
  "active_sessions": 0
}
```

#### 6. View Logs

```bash
# Real-time logs
fly logs

# Or in the dashboard
fly dashboard
```

---

## 🔧 Configuration & Optimization

### Environment Variables (Backend)

You can set environment variables in Fly.io:

```bash
fly secrets set OPENAI_API_KEY=your-key-here
fly secrets set LLM_PROVIDER=openai
```

Or edit `fly.toml`:

```toml
[env]
  LLM_PROVIDER = "ollama"
  OLLAMA_MODEL = "phi3:3.8b"
  ENABLE_RAG = "false"
```

### Keep Backend Warm (Optional)

To reduce cold starts, ping your backend every 10-15 minutes:

**Option 1: UptimeRobot (Free)**
1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Add monitor:
   - URL: `https://jwt-visualiser-api.fly.dev/health`
   - Interval: 10 minutes

**Option 2: GitHub Actions**

Create `.github/workflows/keepalive.yml`:

```yaml
name: Keep Backend Warm
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -f https://jwt-visualiser-api.fly.dev/health || exit 0
```

---

## 📊 Resource Requirements

### Frontend (Cloudflare Pages)
- **Free Tier Limits:**
  - ✅ Unlimited bandwidth
  - ✅ Unlimited requests
  - ✅ 500 builds/month
  - ✅ Global CDN

### Backend (Fly.io)
- **Free Tier Limits:**
  - ✅ 3 shared-cpu VMs (256MB RAM each)
  - ✅ 160GB/month bandwidth
  - ⚠️ **Note**: Running Ollama + phi3:3.8b requires ~4GB RAM
  - 💡 **Recommendation**: Use shared-cpu-2x (512MB) or pay-as-you-go for 4GB

**Estimated Monthly Cost (Fly.io):**
- Free tier: $0 (with limitations)
- With 4GB RAM VM: ~$20-30/month (for better performance)

---

## 🐛 Troubleshooting

### Frontend Issues

**Build fails:**
```bash
cd frontend
rm -rf .next out node_modules
npm install
npm run build
```

**API calls failing:**
- Check `NEXT_PUBLIC_API_URL` in Cloudflare Pages settings
- Verify backend is running: `fly status`
- Check CORS settings in backend `main.py`

### Backend Issues

**Container fails to start:**
```bash
fly logs
fly ssh console  # SSH into the container
```

**Ollama model not loading:**
```bash
# Check if model is pulled
fly ssh console
ollama list
```

**Out of memory:**
- Increase VM size in `fly.toml`:
  ```toml
  [[vm]]
    memory_mb = 4096  # 4GB
  ```
- Then redeploy: `fly deploy`

**Cold starts taking too long:**
- Enable persistent volume for Ollama models (see `fly.toml` comments)
- Consider using phi2 (2.7GB) instead of phi3:3.8b (3.8GB) for faster cold starts

---

## 🔄 CI/CD Automation

### Automatic Deployments

**Frontend (Cloudflare Pages)**
- Already automatic via GitHub integration
- Pushes to `main` branch trigger deployments

**Backend (Fly.io)**

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Fly.io
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup:**
1. Get your Fly.io token: `fly tokens create deploy`
2. Add to GitHub Secrets: `FLY_API_TOKEN`

---

## 📈 Monitoring & Logs

### Fly.io Monitoring

```bash
# Real-time logs
fly logs

# Metrics
fly dashboard

# Scale up/down
fly scale count 2  # Run 2 instances
fly scale memory 2048  # Use 2GB RAM

# SSH into container
fly ssh console
```

### Health Checks

Your backend has a health endpoint: `/health`

**Monitor these metrics:**
- `status`: Should be "healthy"
- `llm_provider`: "ollama"
- `active_sessions`: Number of concurrent WebSocket connections

---

## 💡 Performance Tips

### Frontend
- ✅ Already optimized (static export)
- ✅ Global CDN (instant worldwide)
- ✅ No cold starts

### Backend
1. **Use a smaller model**: phi3:3.8b (3.8GB) balances quality and speed
2. **Persistent volume**: Cache Ollama models between deploys
3. **Warm-up strategy**: Implemented in `main.py` (loads model on startup)
4. **Keep-alive pings**: Prevents cold starts (see above)
5. **Multiple regions**: Deploy to multiple Fly.io regions for lower latency

---

## 🎯 What to Expect

### Loading Times (Best Case)
- **Frontend load**: Instant (Cloudflare CDN)
- **Backend cold start**: 3-8 seconds (with keep-alive: <1s)
- **First LLM response**: 1-2 seconds
- **Subsequent responses**: Fast (<1s)

### Reality Check
This is the **best possible free-tier setup** for running a local LLM like Ollama. Commercial AI APIs (OpenAI, Anthropic) would be faster but cost money.

---

## ✅ Deployment Checklist

### Before Deploying
- [ ] Test locally: `npm run dev` (frontend) + `uvicorn app.main:app` (backend)
- [ ] Verify Ollama works locally
- [ ] Update `NEXT_PUBLIC_API_URL` in frontend
- [ ] Push code to GitHub

### Frontend Deployment
- [ ] Connect GitHub to Cloudflare Pages
- [ ] Set environment variables
- [ ] Verify build succeeds
- [ ] Test deployed URL

### Backend Deployment
- [ ] Install Fly CLI
- [ ] Run `fly launch`
- [ ] Monitor logs: `fly logs`
- [ ] Test health endpoint
- [ ] Update frontend `NEXT_PUBLIC_API_URL`

### Post-Deployment
- [ ] Test full application flow
- [ ] Set up monitoring (UptimeRobot/GitHub Actions)
- [ ] Configure custom domain (optional)
- [ ] Enable analytics (optional)

---

## 🆘 Need Help?

- **Fly.io Docs**: https://fly.io/docs/
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Ollama Docs**: https://ollama.ai/docs/
- **Check backend logs**: `fly logs`
- **SSH to container**: `fly ssh console`

---

## 🚀 Next Steps

Once deployed:
1. Share your app URL
2. Monitor usage and costs
3. Consider adding:
   - Custom domain
   - Analytics
   - Rate limiting
   - User authentication
   - RAG/Vector search (already built-in, just enable `ENABLE_RAG=true`)

---

**You're all set! 🎉**

Your JWT Visualizer is now production-ready with:
- ✅ Instant global CDN (frontend)
- ✅ Docker-powered backend
- ✅ Local LLM (no API costs)
- ✅ Free tier deployment
- ✅ Auto-scaling & health checks

