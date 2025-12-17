# 🔐 JWT Visualiser

> An interactive, educational platform for understanding JSON Web Tokens (JWT) with real-time visualization, AI-powered analysis, and comprehensive security insights.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## 🌟 Features

### 🎬 Interactive Visualizations
- **Step-by-step JWT Decoding**: Watch tokens split into header, payload, and signature with animated transitions
- **Encoding Process**: Understand how JWTs are constructed from JSON to base64url
- **Base64 Microscope**: Deep dive into character-level encoding transformations
- **Real-time Validation**: See cryptographic signature verification in action

### 🤖 AI-Powered Analysis
- **RAG-Enhanced Chat**: Ask questions about JWTs with context-aware responses
- **Smart Documentation**: Vector database powered by ChromaDB with JWT security best practices
- **Multi-LLM Support**: OpenAI GPT-4 and Google Gemini integration
- **Streaming Responses**: Character-by-character typing effect for engaging UX

### 🛡️ Security Features
- **Corruption Detection**: Automatic identification of tampered or invalid tokens
- **Visual Warnings**: Beautiful, educational alerts for security issues
- **Algorithm Support**: HS256, HS384, HS512, RS256, and more
- **Token Validation**: Real-time structure and signature verification

### 🎨 User Experience
- **Dark Mode UI**: Sleek, modern interface inspired by Claude AI
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered transitions
- **Persistent State**: Zustand state management across tabs

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Visualise │  │  Decode  │  │ Generate │  │  Ask AI  │   │
│  └────────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │      │
│         └──────────────┴──────────────┴──────────────┘      │
│                           │                                 │
│                    Zustand Store                            │
└─────────────────────────────────────────────────────────────┘
                             │
                    REST API / WebSocket
                             │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ JWT Analysis │  │ Generation │  │   RAG System       │   │
│  └──────────────┘  └────────────┘  └────────────────────┘   │
│         │                                    │              │
│         │                         ┌──────────┴──────────┐   │
│         │                         │                     │   │
│    PyJWT Library            ChromaDB          LLM Adapters  │
│                                              (OpenAI/Gemini)│
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **Python** 3.11 or higher
- **Poetry** (Python package manager)
- **pnpm/npm/yarn** (Node package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jwt-visualiser.git
   cd jwt-visualiser
   ```

2. **Set up Backend**
   ```bash
   cd backend
   poetry install
   cp .env.example .env  # Configure your API keys
   poetry run uvicorn app.main:app --reload
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📚 Documentation

- [Backend Documentation](./backend/README.md) - API endpoints, configuration, deployment
- [Frontend Documentation](./frontend/README.md) - Components, state management, styling

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12
- **State Management**: Zustand 5
- **Icons**: Lucide React
- **Markdown**: React Markdown

### Backend
- **Framework**: FastAPI 0.110
- **Language**: Python 3.11+
- **JWT Library**: PyJWT 2.8
- **Validation**: Pydantic 2.6
- **LLM Integration**: LangChain
- **Vector DB**: ChromaDB
- **Embeddings**: HuggingFace Sentence Transformers
- **Server**: Uvicorn (ASGI)

### AI & ML
- **LLM Providers**: OpenAI GPT-4, Google Gemini
- **Embeddings**: all-MiniLM-L6-v2 (Local, Free)
- **RAG**: Custom implementation with ChromaDB
- **Token Counting**: tiktoken

## 📁 Project Structure

```
jwt-visualiser/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes and schemas
│   │   ├── core/         # Configuration and settings
│   │   ├── jwt/          # JWT processing logic
│   │   ├── llm/          # LLM adapters (OpenAI, Gemini)
│   │   ├── vector/       # Vector database integration
│   │   └── main.py       # FastAPI application
│   ├── chroma_db/        # Local vector storage
│   ├── pyproject.toml    # Python dependencies
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── ask/          # AI chat interface
│   │   ├── decode/       # JWT decoder
│   │   ├── generate/     # JWT generator
│   │   ├── visualise/    # Interactive visualizations
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable components
│   ├── store/            # Zustand stores
│   ├── package.json
│   └── README.md
│
└── README.md
```

## 🔐 Environment Variables

### Backend (.env)
```env
# LLM Configuration
LLM_PROVIDER=openai  # or gemini
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (if needed)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚢 Deployment

### Backend Deployment (Production)

**Option 1: Docker**
```bash
cd backend
docker build -t jwt-visualiser-backend .
docker run -p 8000:8000 --env-file .env jwt-visualiser-backend
```

**Option 2: Direct Deployment**
```bash
poetry install --no-dev
poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment

**Vercel (Recommended)**
```bash
cd frontend
vercel
```

**Docker**
```bash
cd frontend
docker build -t jwt-visualiser-frontend .
docker run -p 3000:3000 jwt-visualiser-frontend
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
poetry run pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🐛 Known Issues & Limitations

- WebSocket connection requires backend to be running
- Some JWT algorithms may require additional dependencies
- Vector database initialization takes ~30 seconds on first run
- LLM responses require valid API keys

## 🗺️ Roadmap

- [ ] Support for more JWT algorithms (ES256, PS256)
- [ ] Token lifetime visualization
- [ ] JWT security audit tool
- [ ] Export functionality (PDF reports)
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] JWT performance benchmarks
- [ ] Custom algorithm support


## 👥 Authors

- **Dhanush** - *Initial work* - [dhanush.atwork@gmail.com](mailto:dhanush.atwork@gmail.com)

## 🙏 Acknowledgments

- JWT.io for inspiration
- FastAPI and Next.js communities
- OpenAI and Google for LLM APIs
- All contributors and supporters

## 📧 Support

For support, email dhanush.atwork@gmail.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ for the developer community</p>
<p align="center">⭐ Star us on GitHub — it helps!</p>

