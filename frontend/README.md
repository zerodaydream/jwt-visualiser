# 🎨 JWT Visualiser Frontend

> Modern, interactive React application built with Next.js 16, providing beautiful visualizations and intuitive interfaces for understanding JSON Web Tokens.

## 🌟 Features

- ✨ **Interactive Animations**: Smooth Framer Motion transitions
- 🎬 **Step-by-Step Visualizations**: Watch JWTs decode/encode in real-time
- 🤖 **AI Chat Interface**: Stream responses with typing effect
- 🎨 **Dark Mode Design**: Claude AI-inspired beautiful UI
- 📱 **Responsive**: Works on all devices
- ⚡ **Fast Performance**: Next.js App Router with React Server Components
- 🔄 **State Management**: Zustand for global state
- 🎯 **TypeScript**: Full type safety

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Pages & Features](#pages--features)
- [Components](#components)
- [State Management](#state-management)
- [Styling](#styling)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Best Practices](#best-practices)

## 🏗️ Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── ask/               # AI Chat page
│   ├── decode/            # JWT Decoder page
│   ├── generate/          # JWT Generator page
│   ├── visualise/         # Interactive Visualizer
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # Reusable components
│   ├── features/         # Feature-specific components
│   │   ├── ClaudeText.tsx
│   │   └── SampleTokenHero.tsx
│   ├── layout/           # Layout components
│   │   ├── JwtTokenBar.tsx
│   │   └── SessionPanel.tsx
│   └── ui/              # UI primitives (if needed)
│
├── store/               # Zustand state management
│   ├── jwtStore.ts     # JWT token state
│   └── chatStore.ts    # Chat messages state
│
├── lib/                # Utility functions
│
└── public/             # Static assets
```

## 📦 Installation

### Prerequisites

- Node.js 18.0 or higher
- npm, pnpm, or yarn

### Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Access the application at http://localhost:3000

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

### App Directory (Pages)

#### Home Page (`app/page.tsx`)
- Landing page with hero section
- Sample JWT token display
- Quick navigation to features

#### Decode Page (`app/decode/page.tsx`)
- JWT decoder interface
- Input validation
- Formatted JSON output
- Error handling

#### Generate Page (`app/generate/page.tsx`)
- JWT generation form
- Algorithm selection
- Custom claims builder
- Secret key input

#### Visualise Page (`app/visualise/page.tsx`)
- Interactive animations
- Step-by-step process
- Decode/Encode mode toggle
- Progress ring timers
- Corruption warnings

#### Ask AI Page (`app/ask/page.tsx`)
- WebSocket-based chat
- Streaming responses
- Context-aware conversations
- Message history

### Key Components

#### JwtTokenBar (`components/layout/JwtTokenBar.tsx`)
```typescript
// Global JWT token display and input
// Features:
// - Token validation
// - Copy functionality
// - Visual feedback
// - Paste handling
```

#### SampleTokenHero (`components/features/SampleTokenHero.tsx`)
```typescript
// Sample JWT display with animations
// Features:
// - Interactive hover effects
// - Copy to clipboard
// - Color-coded sections
// - Educational tooltips
```

#### CorruptionWarning (`app/visualise/page.tsx`)
```typescript
// Beautiful corruption warnings
// Features:
// - Animated diagrams
// - Educational content
// - Expandable details
// - Multiple warning types
```

## 🗃️ State Management

### JWT Store (`store/jwtStore.ts`)

```typescript
interface JwtStore {
  rawToken: string;                    // Current JWT token
  isValidStructure: boolean;           // Structure validation
  parts: string[];                     // [header, payload, signature]
  setToken: (token: string) => void;   // Update token
  clearToken: () => void;              // Clear state
}

// Usage
import { useJwtStore } from '@/store/jwtStore';

function MyComponent() {
  const { rawToken, setToken } = useJwtStore();
  
  return (
    <input 
      value={rawToken} 
      onChange={(e) => setToken(e.target.value)} 
    />
  );
}
```

### Chat Store (`store/chatStore.ts`)

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

// Usage
import { useChatStore } from '@/store/chatStore';

function ChatComponent() {
  const { messages, addMessage } = useChatStore();
  
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## 🎨 Styling

### Tailwind Configuration

The project uses a custom theme inspired by Claude AI:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'claude-bg': '#1a1a1a',
      'claude-surface': '#262626',
      'claude-input': '#333333',
      'claude-border': '#404040',
      'claude-text': '#e5e5e5',
      'claude-subtext': '#a3a3a3',
      'claude-accent': '#10a37f',
      'jwt-header': '#fb923c',
      'jwt-payload': '#a78bfa',
      'jwt-signature': '#5fb0b0',
    }
  }
}
```

### CSS Classes

**Typography:**
```css
.text-claude-text    /* Primary text */
.text-claude-subtext /* Secondary text */
.font-mono          /* Monospace font */
```

**Layout:**
```css
.bg-claude-bg       /* Background */
.bg-claude-surface  /* Card backgrounds */
.border-claude-border /* Borders */
```

**JWT Colors:**
```css
.text-jwt-header    /* Header (orange) */
.text-jwt-payload   /* Payload (purple) */
.text-jwt-signature /* Signature (teal) */
```

### Framer Motion Animations

```typescript
// Fade in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Stagger children
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ staggerChildren: 0.1 }}
>
  {items.map(item => (
    <motion.div
      key={item}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

## 🔧 Development

### Adding a New Page

1. Create page file:
```typescript
// app/mypage/page.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. Add to navigation (if needed):
```typescript
// components/layout/Navigation.tsx
<Link href="/mypage">My Page</Link>
```

### Creating a Component

```typescript
// components/features/MyComponent.tsx
'use client';
import { motion } from 'framer-motion';

interface MyComponentProps {
  title: string;
  content: string;
}

export function MyComponent({ title, content }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-claude-surface rounded-lg"
    >
      <h2 className="text-claude-text font-bold">{title}</h2>
      <p className="text-claude-subtext">{content}</p>
    </motion.div>
  );
}
```

### WebSocket Integration

```typescript
const ws = new WebSocket('ws://localhost:8000/api/v1/ask/ws');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## 🚢 Building & Deployment

### Production Build

```bash
npm run build
```

Output:
- `.next/` directory contains optimized production bundle
- Static files in `public/` are served as-is

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Access in code:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Static Export (if no server features needed)

```bash
# Add to next.config.ts
output: 'export'

# Build
npm run build

# Output in out/ directory
```

## 📊 Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/logo.svg"
  alt="Logo"
  width={100}
  height={100}
  priority
/>
```

### Code Splitting

```typescript
// Dynamic imports
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false // Client-side only
});
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      {children}
    </html>
  );
}
```

## ✅ Best Practices

### TypeScript

```typescript
// Use interfaces for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// Use type for unions/intersections
type Status = 'idle' | 'loading' | 'success' | 'error';
```

### React Patterns

```typescript
// Use React.memo for expensive renders
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render */}</div>;
});

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  // handler
}, [dependencies]);

// Use useMemo for expensive computations
const computed = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

### Accessibility

```typescript
<button
  aria-label="Copy token"
  aria-pressed={copied}
  onClick={handleCopy}
>
  {copied ? 'Copied!' : 'Copy'}
</button>

<input
  aria-label="JWT Token"
  aria-invalid={!isValid}
  aria-describedby="token-error"
/>
```

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';
import { useEffect } from 'react';

export function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Common Issues

#### Hydration Errors
```
Error: Text content does not match server-rendered HTML
```
**Solution:** Ensure client/server rendered content matches or use `suppressHydrationWarning`.

#### Module Not Found
```
Error: Cannot find module '@/components/...'
```
**Solution:** Check tsconfig.json paths and file locations.

#### WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:8000' failed
```
**Solution:** Ensure backend is running and CORS is configured.

### Debug Mode

```typescript
// Enable React DevTools
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', state);
}
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

See main [README.md](../README.md) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) file.

## 📧 Support

For frontend-specific issues:
1. Check browser console for errors
2. Review component documentation
3. Open an issue on GitHub
4. Email: dhanush.atwork@gmail.com

---

Built with ⚛️ React, ⚡ Next.js, and 💙 TypeScript
