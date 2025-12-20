# 🎨 JWT Visualiser Frontend

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Modern, interactive web application for understanding and analyzing JSON Web Tokens**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

JWT Visualiser Frontend is a production-ready Next.js application that provides an intuitive, educational interface for working with JSON Web Tokens. Built with modern web technologies, it features smooth animations, real-time WebSocket communication, and a beautiful dark-mode UI inspired by professional AI interfaces.

### Key Highlights

- **Interactive Visualizations**: Watch JWTs decode/encode with cinematic animations
- **AI-Powered Chat**: Real-time streaming responses with conversation memory
- **Professional UI**: Claude AI-inspired design with Framer Motion animations
- **Type-Safe**: Full TypeScript coverage with strict mode enabled
- **Performance Optimized**: Next.js 15 with App Router and React Server Components
- **Production Ready**: Deployed on Cloudflare Pages with global CDN

---

## 🌟 Features

### Core Functionality

| Feature | Description | Technology |
|---------|-------------|------------|
| **JWT Decoder** | Instant token parsing with visual feedback | React, Zustand |
| **JWT Generator** | Create tokens with 14+ algorithms | Custom form validation |
| **Interactive Visualizer** | Step-by-step encoding/decoding animations | Framer Motion |
| **AI Security Analyst** | Context-aware JWT analysis | WebSocket, SSE |

### User Experience

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Real-time Validation** | Instant feedback on token structure | Custom hooks |
| **Color-Coded Sections** | Visual distinction of header/payload/signature | Tailwind CSS |
| **Copy to Clipboard** | One-click token copying | Clipboard API |
| **Sample Tokens** | Pre-configured examples for learning | Static generation |
| **Responsive Design** | Mobile-first adaptive layouts | Tailwind breakpoints |
| **Dark Mode** | Professional dark theme | CSS variables |

### Technical Features

| Feature | Description | Purpose |
|---------|-------------|---------|
| **State Management** | Zustand for global state | Lightweight, no boilerplate |
| **API Abstraction** | Centralized request handling | Easy environment switching |
| **Error Boundaries** | Graceful error handling | Improved UX |
| **TypeScript Strict** | Full type coverage | Catch errors at compile time |
| **Code Splitting** | Dynamic imports for heavy components | Faster initial load |
| **Static Export** | Pre-rendered HTML for CDN deployment | Maximum performance |

---

## 🏗️ Architecture

```
frontend/
├── app/                           # Next.js App Router (Routes)
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home/Landing page
│   ├── globals.css                # Global styles & CSS variables
│   │
│   ├── decode/                    # JWT Decoder page
│   │   └── page.tsx
│   │
│   ├── generate/                  # JWT Generator page
│   │   └── page.tsx
│   │
│   ├── visualise/                 # Interactive Visualizer
│   │   └── page.tsx
│   │
│   └── ask/                       # AI Chat Interface
│       └── page.tsx
│
├── components/                    # Reusable components
│   ├── features/                  # Feature-specific components
│   │   ├── ClaudeText.tsx         # Typewriter effect text
│   │   └── SampleTokenHero.tsx    # Sample token display
│   │
│   └── layout/                    # Layout components
│       ├── JwtTokenBar.tsx        # Global token input/display
│       └── SessionPanel.tsx       # Session management UI
│
├── store/                         # State management
│   ├── jwtStore.ts                # JWT token state
│   └── chatStore.ts               # Chat messages state
│
├── utils/                         # Utility functions
│   └── api.ts                     # API request helpers
│
├── public/                        # Static assets
│   ├── file.svg
│   ├── globe.svg
│   └── next.svg
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── next.config.ts                 # Next.js configuration
└── README.md                      # This file
```

### Component Hierarchy

```
App
├── RootLayout
│   ├── JwtTokenBar (Global)
│   └── Page Content
│       ├── HomePage
│       │   └── SampleTokenHero
│       │
│       ├── DecodePage
│       │   ├── Header Display
│       │   ├── Payload Display
│       │   └── Signature Display
│       │
│       ├── GeneratePage
│       │   ├── Payload Editor
│       │   ├── Algorithm Selector
│       │   └── Generated Token Display
│       │
│       ├── VisualisePage
│       │   ├── Animation Controller
│       │   ├── Token Breakdown
│       │   └── Corruption Warnings
│       │
│       └── AskPage
│           ├── SessionPanel
│           ├── Message List
│           ├── Input Form
│           └── Connection Status
```

---

## 📦 Installation

### Prerequisites

- **Node.js**: 18.0 or higher (LTS recommended)
- **Package Manager**: npm, yarn, or pnpm
- **Backend**: JWT Visualiser Backend running (see [backend README](../backend/README.md))

### Quick Setup

```bash
# Clone repository
git clone https://github.com/yourusername/jwt-visualiser.git
cd jwt-visualiser/frontend

# Install dependencies (choose one)
npm install
# or
yarn install
# or
pnpm install
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Start dev server with hot-reload
npm run dev

# Or with turbopack (faster)
npm run dev --turbo

# Access at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or static export (for CDN)
npm run build && npm run export
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Type check
npx tsc --noEmit

# Format code (if using Prettier)
npm run format
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file in the root:

```bash
# ===================================
# API CONFIGURATION
# ===================================

# Backend API URL
# Development: http://localhost:8000
# Production: Your deployed backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# ===================================
# OPTIONAL FEATURES
# ===================================

# Enable debug logs
NEXT_PUBLIC_DEBUG=false

# Analytics ID (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### API Configuration

The frontend automatically uses the correct API URL based on environment:

```typescript
// utils/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jwt-visualiser.onrender.com';

// Usage in components
const data = await apiRequest('/api/v1/decode', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

### Tailwind Theme Customization

Edit `tailwind.config.ts` to customize colors:

```typescript
theme: {
  extend: {
    colors: {
      'claude-bg': '#1a1a1a',           // Main background
      'claude-surface': '#262626',      // Card backgrounds
      'claude-input': '#333333',        // Input backgrounds
      'claude-border': '#404040',       // Border color
      'claude-text': '#e5e5e5',         // Primary text
      'claude-subtext': '#a3a3a3',      // Secondary text
      'claude-accent': '#10a37f',       // Accent/CTA color
      'jwt-header': '#fb923c',          // JWT header color (orange)
      'jwt-payload': '#a78bfa',         // JWT payload color (purple)
      'jwt-signature': '#5fb0b0',       // JWT signature color (teal)
    },
    fontFamily: {
      sans: ['var(--font-geist-sans)'],
      mono: ['var(--font-geist-mono)'],
    },
  },
}
```

---

## 📚 Pages & Features

### 1. Home Page (`/`)

**Purpose**: Landing page with introduction and sample JWT

**Components**:
- Hero section with animated text
- Sample JWT token display
- Quick navigation cards
- Feature highlights

**Code Example**:
```typescript
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <Hero />
      <SampleTokenHero />
      <FeatureGrid />
    </div>
  );
}
```

---

### 2. Decode Page (`/decode`)

**Purpose**: Decode and analyze JWT tokens in real-time

**Features**:
- Instant token validation
- Formatted JSON display
- AI-powered explanations
- Copy decoded sections

**API Integration**:
```typescript
const decoded = await apiRequest<TokenResponse>('/api/v1/decode', {
  method: 'POST',
  body: JSON.stringify({ token: rawToken })
});
```

**UI Components**:
- Header section with algorithm badge
- Payload display with claim explanations
- Signature validation indicator

---

### 3. Generate Page (`/generate`)

**Purpose**: Create custom JWT tokens with various algorithms

**Features**:
- JSON payload editor with syntax highlighting
- Algorithm selector (HS256, RS256, ES256, EdDSA, etc.)
- Secret key input with auto-generation
- Expiration time slider (5 min - 24 hours)
- Real-time token generation
- Copy generated token
- View decoded result

**Supported Algorithms**:
```typescript
const ALGOS = [
  { value: 'HS256', label: 'HMAC SHA-256' },
  { value: 'HS384', label: 'HMAC SHA-384' },
  { value: 'HS512', label: 'HMAC SHA-512' },
  { value: 'RS256', label: 'RSA SHA-256' },
  { value: 'RS384', label: 'RSA SHA-384' },
  { value: 'RS512', label: 'RSA SHA-512' },
  { value: 'ES256', label: 'ECDSA P-256' },
  { value: 'ES384', label: 'ECDSA P-384' },
  { value: 'ES512', label: 'ECDSA P-521' },
  { value: 'PS256', label: 'RSA-PSS SHA-256' },
  { value: 'PS384', label: 'RSA-PSS SHA-384' },
  { value: 'PS512', label: 'RSA-PSS SHA-512' },
  { value: 'EdDSA', label: 'EdDSA Ed25519' },
];
```

---

### 4. Visualise Page (`/visualise`)

**Purpose**: Interactive step-by-step JWT visualization

**Features**:
- Animated token breakdown
- Encoding/decoding process visualization
- Base64 character transformation
- Corruption detection with beautiful warnings
- Educational tooltips

**Animation States**:
```typescript
type CinematicState = 
  | 'idle'        // Waiting for input
  | 'header'      // Highlighting header
  | 'payload'     // Highlighting payload
  | 'signature'   // Highlighting signature
  | 'shrinking'   // Transition animation
  | 'docked';     // Final compact state
```

---

### 5. Ask AI Page (`/ask`)

**Purpose**: Chat with AI security analyst about JWT tokens

**Features**:
- Real-time WebSocket streaming
- Conversation memory (session-based)
- Context-aware responses
- Token usage display
- Rate limit indicators
- Connection status monitoring

**WebSocket Protocol**:
```typescript
// Client → Server
{
  type: 'ask',
  token: 'eyJhbGc...',
  question: 'What security issues does this token have?'
}

// Server → Client
{
  type: 'chunk' | 'complete' | 'rate_limit' | 'error',
  content: 'streaming response...',
  timestamp: '2024-01-01T00:00:00Z'
}
```

**Implementation**:
```typescript
const ws = new WebSocket(`${WS_URL}/api/v1/ask/ws`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'chunk':
      appendToMessage(data.content);
      break;
    case 'complete':
      finalizeMessage(data.full_response);
      break;
    case 'rate_limit':
      showRateLimitInfo(data);
      break;
    case 'error':
      handleError(data.message);
      break;
  }
};
```

---

## 🗃️ State Management

### JWT Store

**Purpose**: Manage global JWT token state

```typescript
// store/jwtStore.ts
interface JwtStore {
  rawToken: string;                    // Full JWT string
  isValidStructure: boolean;           // true if 3 parts exist
  validationError: string | null;      // Error message if invalid
  parts: string[];                     // [header, payload, signature]
  
  setToken: (token: string) => void;   // Update & validate token
  clearToken: () => void;              // Reset to empty state
}

// Usage
const { rawToken, setToken, isValidStructure } = useJwtStore();
```

### Chat Store

**Purpose**: Manage chat conversation state

```typescript
// store/chatStore.ts
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatStore {
  messages: Message[];
  
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  getLastUserMessage: () => Message | null;
}

// Usage
const { messages, addMessage } = useChatStore();
```

---

## 🎨 Styling Guide

### Color Palette

```typescript
// Background Colors
bg-claude-bg         // #1a1a1a - Main background
bg-claude-surface    // #262626 - Cards, panels
bg-claude-input      // #333333 - Form inputs

// Text Colors
text-claude-text     // #e5e5e5 - Primary text
text-claude-subtext  // #a3a3a3 - Secondary text
text-claude-accent   // #10a37f - CTAs, links

// JWT Colors
text-jwt-header      // #fb923c - Orange
text-jwt-payload     // #a78bfa - Purple
text-jwt-signature   // #5fb0b0 - Teal

// Borders
border-claude-border // #404040 - All borders
```

### Typography

```css
/* Headings */
.font-serif          /* Elegant headings */
.text-3xl            /* 30px */
.text-2xl            /* 24px */

/* Body Text */
.text-base           /* 16px */
.text-sm             /* 14px */
.text-xs             /* 12px */

/* Code */
.font-mono           /* Monospace font */
```

### Spacing System

```css
/* Padding/Margin Scale */
p-2  /* 0.5rem = 8px */
p-4  /* 1rem = 16px */
p-6  /* 1.5rem = 24px */
p-8  /* 2rem = 32px */

/* Gap (Flexbox/Grid) */
gap-2  /* 8px */
gap-4  /* 16px */
gap-6  /* 24px */
```

### Animation Patterns

```typescript
// Fade in from bottom
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Stagger children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>

// Pulse effect
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ repeat: Infinity, duration: 2 }}
>
```

---

## 🚢 Deployment

### Cloudflare Pages (Recommended)

**Why Cloudflare Pages?**
- Global CDN distribution
- Automatic HTTPS
- Git-based deployments
- Zero-config setup
- Generous free tier

**Setup Steps**:

1. **Connect Repository**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub account
   - Select `jwt-visualiser` repository

2. **Build Configuration**:
   ```
   Build command: npm run build
   Build output directory: out
   Root directory: frontend
   ```

3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://jwt-visualiser.onrender.com
   ```

4. **Deploy**:
   - Click "Save and Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at `https://jwt-visualiser.pages.dev`

---

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
```

---

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build & Run
docker build -t jwt-visualiser-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-backend.com jwt-visualiser-frontend
```

---

### Static Export (CDN)

For maximum performance with static hosting:

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true  // Required for static export
  }
};
```

```bash
# Build static site
npm run build

# Output in out/ directory
# Upload to any static host (Netlify, S3, GitHub Pages)
```

---

## 🔧 Development Guide

### Adding a New Page

```bash
# 1. Create page file
mkdir app/mypage
touch app/mypage/page.tsx
```

```typescript
// app/mypage/page.tsx
'use client';

export default function MyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-serif text-claude-text">My Page</h1>
    </div>
  );
}
```

### Creating a Component

```typescript
// components/features/MyComponent.tsx
'use client';

import { motion } from 'framer-motion';

interface MyComponentProps {
  title: string;
  description: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-claude-surface rounded-xl border border-claude-border"
    >
      <h2 className="text-xl font-semibold text-claude-text mb-2">
        {title}
      </h2>
      <p className="text-claude-subtext">
        {description}
      </p>
    </motion.div>
  );
}
```

### Adding to Store

```typescript
// store/myStore.ts
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

---

## 🧪 Testing

### Unit Tests

```bash
# Install testing library
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test
```

```typescript
// __tests__/JwtTokenBar.test.tsx
import { render, screen } from '@testing-library/react';
import { JwtTokenBar } from '@/components/layout/JwtTokenBar';

describe('JwtTokenBar', () => {
  it('renders token input', () => {
    render(<JwtTokenBar />);
    expect(screen.getByPlaceholderText(/paste your jwt/i)).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run tests
npx playwright test
```

---

## 📊 Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/logo.svg"
  alt="Logo"
  width={100}
  height={100}
  priority  // Load immediately
/>
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false  // Client-side only
});
```

### Bundle Analysis

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

---

## 🐛 Troubleshooting

### Issue: Hydration Error

```
Error: Text content does not match server-rendered HTML
```

**Solution**:
```typescript
// Use suppressHydrationWarning for dynamic content
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>

// Or render client-side only
'use client';
```

### Issue: WebSocket Connection Failed

**Solution**:
```typescript
// Check backend is running
// Verify CORS settings
// Use correct protocol (ws:// for http, wss:// for https)

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//localhost:8000/api/v1/ask/ws`);
```

### Issue: Build Fails

```bash
# Clear cache
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-ui`
3. Make your changes
4. Test locally: `npm run build && npm run start`
5. Commit: `git commit -m 'Add amazing UI feature'`
6. Push: `git push origin feature/amazing-ui`
7. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

## 📧 Support

- **Email**: dhanush.atwork@gmail.com
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/jwt-visualiser/issues)
- **Live Demo**: [https://jwt-visualiser.pages.dev](https://jwt-visualiser.pages.dev)

---

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Vercel** for hosting and inspiration
- **Cloudflare** for Pages platform
- **Tailwind Labs** for Tailwind CSS
- **Framer** for Motion library
- **Claude AI** for UI inspiration

---

<div align="center">

**Built with ⚛️ React, ⚡ Next.js, and 💙 TypeScript**

[⬆ Back to Top](#-jwt-visualiser-frontend)

</div>
