'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useJwtStore } from '@/store/jwtStore';
import { useChatStore } from '@/store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, BookOpen, ShieldCheck, Clock, FileJson, Lock, Sparkles, AlertTriangle, Fingerprint, Trash2, AlertCircle } from 'lucide-react';

// --- ANIMATION COMPONENTS ---

// The "Flower Bracket" Pointer
const FlowerBracket = ({ label }: { label: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="absolute -bottom-16 left-0 right-0 flex flex-col items-center"
    >
        <svg width="40" height="20" viewBox="0 0 40 20" className="text-claude-accent mb-2">
            <path d="M0,20 C10,20 15,20 20,0 C25,20 30,20 40,20" 
                  fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="text-claude-accent font-mono text-xs uppercase tracking-widest font-bold">
            {label}
        </span>
    </motion.div>
);

// Decoded Hover Tooltip - Cinematic popup for decoded JWT parts
const DecodedTooltip = ({ content, type, color }: { content: string; type: string; color: string }) => {
    const borderColor = color.includes('header') ? '#F97316' : color.includes('payload') ? '#3B82F6' : '#10B981';
    const bgColor = color.includes('header') ? 'rgba(249, 115, 22, 0.05)' : color.includes('payload') ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 z-[100] pointer-events-none flex flex-col items-center"
            style={{ marginTop: '0.5rem' }}
        >
            {/* Elegant Curved Connector with Glow */}
            <div className="flex flex-col items-center">
                {/* Vertical connecting line with glow */}
                <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-0.5 h-4 mb-1 origin-top"
                    style={{ 
                        background: `linear-gradient(to bottom, ${borderColor}40, ${borderColor})`,
                        boxShadow: `0 0 8px ${borderColor}80`
                    }}
                />
                
                {/* Flower Bracket - Enhanced with glow */}
                <motion.svg 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    width="60" 
                    height="20" 
                    viewBox="0 0 60 20" 
                    className="filter drop-shadow-lg mb-2"
                >
                    <defs>
                        <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={borderColor} stopOpacity="0.2" />
                            <stop offset="50%" stopColor={borderColor} stopOpacity="1" />
                            <stop offset="100%" stopColor={borderColor} stopOpacity="0.2" />
                        </linearGradient>
                        <filter id={`glow-${type}`}>
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path 
                        d="M 5,5 Q 15,5 20,15 Q 25,5 35,5 Q 40,5 45,15 Q 50,5 55,5" 
                        fill="none" 
                        stroke={`url(#gradient-${type})`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter={`url(#glow-${type})`}
                    />
                    {/* Center point indicator */}
                    <circle cx="30" cy="16" r="2" fill={borderColor} opacity="0.8">
                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                </motion.svg>
            </div>

            {/* Content Card - Compact and Elegant */}
            <motion.div 
                initial={{ y: -5 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="relative rounded-lg overflow-hidden shadow-2xl border backdrop-blur-xl"
                style={{ 
                    borderColor: borderColor,
                    background: `linear-gradient(135deg, ${bgColor}, rgba(26, 26, 26, 0.98))`,
                    boxShadow: `0 8px 32px ${borderColor}40, 0 0 0 1px ${borderColor}20`
                }}
            >
                {/* Ambient Glow Background */}
                <div 
                    className="absolute inset-0 opacity-10 blur-2xl"
                    style={{ background: `radial-gradient(circle at top, ${borderColor}, transparent 70%)` }}
                />

                {/* Header with Inline Badge */}
                <div className="relative px-3 py-2 border-b flex items-center justify-between gap-2" style={{ borderColor: `${borderColor}30` }}>
                    <div className="flex items-center gap-2">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: borderColor, boxShadow: `0 0 8px ${borderColor}` }}
                        />
                        <span className="font-mono text-[11px] uppercase tracking-wider font-bold whitespace-nowrap" style={{ color: borderColor }}>
                            {type}
                        </span>
                    </div>
                    <div className="text-[9px] text-claude-subtext font-mono opacity-60 whitespace-nowrap">
                        Decoded
                    </div>
                </div>
                
                {/* Decoded Content - Compact */}
                <div className="relative p-3 max-h-[160px] overflow-y-auto overflow-x-hidden scrollbar-thin w-[300px]">
                    <pre className="text-[10px] text-claude-text font-mono leading-[1.5] whitespace-pre-wrap break-words">
                        {content}
                    </pre>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Base64URL Decode Helper
const base64UrlDecode = (str: string): string => {
    try {
        // Replace URL-safe characters
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if necessary
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }
        // Decode and parse
        const decoded = atob(base64);
        const parsed = JSON.parse(decoded);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return '{\n  "error": "Invalid or corrupted data"\n}';
    }
};

// Format signature for display
const formatSignature = (sig: string): string => {
    if (!sig) return '"[No Signature]"';
    
    // Break long signature into readable chunks
    const chunkSize = 40;
    const chunks = [];
    for (let i = 0; i < sig.length; i += chunkSize) {
        chunks.push(sig.substring(i, i + chunkSize));
    }
    
    return `{\n  "algorithm": "HMAC-SHA256 or RSA",\n  "value": [\n    "${chunks.join('",\n    "')}"\n  ],\n  "length": ${sig.length},\n  "note": "Signature is base64url-encoded binary data"\n}`;
};

// --- MAIN PAGE ---

export default function AskPage() {
  const { rawToken, isValidStructure } = useJwtStore(); 
  const { messages, addMessage, setMessages, clearMessages } = useChatStore();
  const [query, setQuery] = useState('');
  
  // Cinematic State Machine
  const [cinematicState, setCinematicState] = useState<'idle' | 'header' | 'payload' | 'signature' | 'shrinking' | 'docked'>('idle');
  
  // Hover state for JWT parts
  const [hoveredPart, setHoveredPart] = useState<'header' | 'payload' | 'signature' | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [authStatus, setAuthStatus] = useState<'idle' | 'validating' | 'validated' | 'failed'>('idle');
  const [tokenCount, setTokenCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Character buffer for true character-by-character typing effect
  const charBufferRef = useRef<string[]>([]);
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const CHAR_DISPLAY_DELAY = 20; // ms between characters (true typing effect)

  // Auto-scroll function
  const scrollToBottom = useCallback((smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Instant display from buffer - no delays
  const startCharDisplay = useCallback(() => {
    // No interval needed - we'll display chunks instantly
  }, []);

  // Stop character display and clear buffer
  const stopCharDisplay = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
    // Display any remaining buffered characters immediately
    if (charBufferRef.current.length > 0) {
      const remaining = charBufferRef.current.join('');
      setStreamingMessage(prev => prev + remaining);
      charBufferRef.current = [];
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket('ws://localhost:8000/api/v1/ask/ws');
      
      ws.onopen = () => {
        console.log('[WebSocket] Connection established');
        setConnectionStatus('connected');
        setAuthStatus('idle');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Received:', message.type, message);
          
          switch (message.type) {
            case 'connection':
              console.log('[WebSocket] Connection confirmed:', message.message);
              break;
            
            case 'auth':
              setAuthStatus(message.status === 'validated' ? 'validated' : 'validating');
              if (message.status === 'failed') {
                setAuthStatus('failed');
              }
              break;
            
            case 'rag':
              console.log('[WebSocket] RAG status:', message.status, message.doc_count || 0, 'docs');
              break;
            
            case 'stream_start':
              // Reset and start controlled character-by-character display
              charBufferRef.current = [];
              setIsStreaming(true);
              setStreamingMessage('');
              setTokenCount(0);
              startCharDisplay();
              break;
            
            case 'chunk':
              // Display chunks instantly - no typing effect delay
              setStreamingMessage(prev => prev + message.content);
              setTokenCount(message.token_number);
              break;
            
            case 'complete':
              // Stop display interval and flush buffer
              stopCharDisplay();
              
              // Instantly complete - no delay
              setIsStreaming(false);
              setStreamingMessage('');
              setTokenCount(0);
              addMessage({
                role: 'assistant',
                content: message.full_response,
                sources: message.context_used
              });
              setAuthStatus('idle');
              break;
            
            case 'error':
              console.error('[WebSocket] Error:', message);
              stopCharDisplay();
              setIsStreaming(false);
              setStreamingMessage('');
              addMessage({
                role: 'assistant',
                content: `**Error:** ${message.error}\n\n${message.details || ''}`
              });
              setAuthStatus('failed');
              break;
            
            case 'pong':
              // Heartbeat response
              break;
            
            default:
              console.warn('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
      
      ws.onerror = (error) => {
        // WebSocket errors typically have empty error objects
        // The actual error details come through onclose
        console.warn('[WebSocket] Connection error - backend may not be running');
        setConnectionStatus('error');
      };
      
      ws.onclose = (event) => {
        const isCleanClose = event.code === 1000;
        const isServerUnavailable = event.code === 1006;
        
        if (isServerUnavailable) {
          console.warn('[WebSocket] Backend server is not available at ws://localhost:8000');
        } else if (!isCleanClose) {
          console.log('[WebSocket] Connection closed:', event.code, event.reason);
        }
        
        setConnectionStatus('disconnected');
        setIsStreaming(false);
        wsRef.current = null;
        
        // Auto-reconnect after 5 seconds if not a clean close and not due to server unavailability
        if (!isCleanClose && !isServerUnavailable) {
          console.log('[WebSocket] Attempting to reconnect in 5s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        } else if (isServerUnavailable) {
          // Don't spam reconnection attempts if server is down
          console.log('[WebSocket] Not attempting to reconnect - server appears to be down');
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      setConnectionStatus('error');
    }
  }, [addMessage, startCharDisplay, stopCharDisplay]);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, streamingMessage, cinematicState, scrollToBottom]);

  // Initial Greeting Message - only run once when component mounts with valid token
  useEffect(() => {
    // Only initialize once per session and only if we have a valid token and no messages yet
    if (initialized.current) return;
    if (!rawToken || !isValidStructure) return;
    if (messages.length > 0) return;
    
      initialized.current = true;
    
    const greeting = `Hello! I'm your **JWT Security Expert** with deep knowledge of RFC 7519 (JWT) and RFC 7515 (JWS) standards.

I can help you analyze your token's **claims**, identify **security vulnerabilities**, validate **expiration times**, and explain **signature algorithms**.

Try asking:
- "Is this token expired?"
- "What security issues should I be aware of?"
- "Explain the claims in this token"
- "What algorithm is being used?"`;

    addMessage({ role: 'assistant', content: greeting });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawToken, isValidStructure]);

  const handleAsk = async (e: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const question = manualQuery || query;
    if (!question.trim() || !rawToken || !isValidStructure || (cinematicState !== 'idle' && cinematicState !== 'docked')) return;

    // Check WebSocket connection
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addMessage({ 
        role: 'assistant', 
        content: "**Connection Error:** WebSocket is not connected. Attempting to reconnect..." 
      });
      connectWebSocket();
      return;
    }

    setQuery('');
    setCinematicState('header'); 

    // Remove welcome message if first question
    const hasUserMessages = messages.some(msg => msg.role === 'user');
    if (!hasUserMessages && messages.length === 1) {
      setMessages([{ role: 'user', content: question }]);
    } else {
      addMessage({ role: 'user', content: question });
    }

    try {
      // Skip cinematic animation - go straight to docked
      setCinematicState('docked');                 

      // Send question via WebSocket (history is managed by backend session)
      wsRef.current.send(JSON.stringify({
        type: 'ask',
        token: rawToken,
        question: question
      }));

      console.log('[WebSocket] Question sent:', question);

    } catch (err: any) {
      console.error('[WebSocket] Send error:', err);
      setCinematicState('docked');
      setIsStreaming(false);
      setStreamingMessage('');
      addMessage({ 
        role: 'assistant', 
        content: `**Error:** Failed to send message. ${err.message}` 
      });
    }
  };

  const parts = rawToken ? rawToken.split('.') : ['', '', ''];
  const truncate = (s: string) => s.length > 12 ? s.substring(0, 12) + '...' : s;

  if (!rawToken || !isValidStructure) return <EmptyState />;

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col relative px-4 -m-6 p-6 overflow-visible">
      
      <AnimatePresence>
        {cinematicState === 'docked' && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-claude-surface border border-claude-border rounded-lg p-3 flex justify-center items-center gap-1 shadow-sm select-none z-10 shrink-0 relative overflow-visible"
                style={{ marginBottom: hoveredPart ? '15rem' : '1rem', transition: 'margin-bottom 0.3s ease-in-out' }}
            >
                <div className="flex font-mono text-sm md:text-base opacity-80 items-center gap-0.5">
                    {/* Header Part */}
                    <div 
                        className="relative inline-flex items-center cursor-pointer transition-all duration-300 ease-out group px-1 py-0.5 rounded"
                        onMouseEnter={() => setHoveredPart('header')}
                        onMouseLeave={() => setHoveredPart(null)}
                        style={{ 
                            backgroundColor: hoveredPart === 'header' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                        }}
                    >
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'header' ? 'opacity-70 text-orange-400' : 'opacity-50'}`}>{'{'}</span>
                        <span className={`text-jwt-header font-bold transition-all duration-300 ${
                            hoveredPart === 'header' 
                                ? 'text-orange-400 scale-105 drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]' 
                                : 'hover:text-orange-300'
                        }`}>
                            {truncate(parts[0])}
                        </span>
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'header' ? 'opacity-70 text-orange-400' : 'opacity-50'}`}>{'}'}</span>
                        
                        {/* Tooltip for Header */}
                        <AnimatePresence>
                            {hoveredPart === 'header' && parts[0] && (
                                <DecodedTooltip 
                                    content={base64UrlDecode(parts[0])}
                                    type="Header"
                                    color="text-jwt-header"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <span className={`mx-0.5 text-claude-subtext transition-opacity duration-300 ${hoveredPart ? 'opacity-30' : 'opacity-50'}`}>.</span>

                    {/* Payload Part */}
                    <div 
                        className="relative inline-flex items-center cursor-pointer transition-all duration-300 ease-out group px-1 py-0.5 rounded"
                        onMouseEnter={() => setHoveredPart('payload')}
                        onMouseLeave={() => setHoveredPart(null)}
                        style={{ 
                            backgroundColor: hoveredPart === 'payload' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        }}
                    >
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'payload' ? 'opacity-70 text-blue-400' : 'opacity-50'}`}>{'{'}</span>
                        <span className={`text-jwt-payload font-bold transition-all duration-300 ${
                            hoveredPart === 'payload' 
                                ? 'text-blue-400 scale-105 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]' 
                                : 'hover:text-blue-300'
                        }`}>
                            {truncate(parts[1])}
                        </span>
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'payload' ? 'opacity-70 text-blue-400' : 'opacity-50'}`}>{'}'}</span>
                        
                        {/* Tooltip for Payload */}
                        <AnimatePresence>
                            {hoveredPart === 'payload' && parts[1] && (
                                <DecodedTooltip 
                                    content={base64UrlDecode(parts[1])}
                                    type="Payload"
                                    color="text-jwt-payload"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <span className={`mx-0.5 text-claude-subtext transition-opacity duration-300 ${hoveredPart ? 'opacity-30' : 'opacity-50'}`}>.</span>

                    {/* Signature Part */}
                    <div 
                        className="relative inline-flex items-center cursor-pointer transition-all duration-300 ease-out group px-1 py-0.5 rounded"
                        onMouseEnter={() => setHoveredPart('signature')}
                        onMouseLeave={() => setHoveredPart(null)}
                        style={{ 
                            backgroundColor: hoveredPart === 'signature' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        }}
                    >
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'signature' ? 'opacity-70 text-green-400' : 'opacity-50'}`}>{'{'}</span>
                        <span className={`text-jwt-signature font-bold transition-all duration-300 ${
                            hoveredPart === 'signature' 
                                ? 'text-green-400 scale-105 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]' 
                                : 'hover:text-green-300'
                        }`}>
                            {truncate(parts[2])}
                        </span>
                        <span className={`text-claude-subtext transition-all duration-300 ${hoveredPart === 'signature' ? 'opacity-70 text-green-400' : 'opacity-50'}`}>{'}'}</span>
                        
                        {/* Tooltip for Signature */}
                        <AnimatePresence>
                            {hoveredPart === 'signature' && parts[2] && (
                                <DecodedTooltip 
                                    content={formatSignature(parts[2])}
                                    type="Signature"
                                    color="text-jwt-signature"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="ml-4 pl-4 border-l border-claude-border text-[10px] text-claude-subtext uppercase tracking-widest font-bold">
                    Active Context
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* WebSocket Status Bar */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex items-center gap-3 text-xs">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'error' || connectionStatus === 'disconnected' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-claude-subtext font-mono">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Service Unavailable' :
               'Disconnected'}
            </span>
          </div>

        {/* Auth Status */}
        {authStatus !== 'idle' && (
          <div className="flex items-center gap-1.5 text-claude-subtext">
            <Lock size={10} className={
              authStatus === 'validated' ? 'text-green-500' :
              authStatus === 'validating' ? 'text-yellow-500' :
              'text-red-500'
            } />
            <span className="font-mono">
              {authStatus === 'validated' ? 'Token Valid' :
               authStatus === 'validating' ? 'Validating...' :
               'Auth Failed'}
            </span>
          </div>
        )}

        {/* Token Streaming Count */}
        {isStreaming && tokenCount > 0 && (
          <div className="flex items-center gap-1.5 text-claude-accent">
            <Sparkles size={10} />
            <span className="font-mono">{tokenCount} tokens</span>
          </div>
        )}
        </div>

        {/* Service Unavailable Notice */}
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-orange-300 font-semibold mb-1">AI Service Unavailable</div>
                <div className="text-claude-subtext text-[10px] leading-relaxed">
                  The AI chat is currently unavailable. Please ensure the service is running or try again later.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>


      <AnimatePresence>
        {(cinematicState !== 'idle' && cinematicState !== 'docked') && (
            <motion.div 
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 z-50 bg-claude-bg/95 flex items-center justify-center"
            >
                <motion.div 
                    animate={cinematicState === 'shrinking' ? { scale: 0.6, y: -100, opacity: 0 } : { scale: 1, y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="flex flex-col md:flex-row items-center gap-3 relative"
                >
                    <div className="relative">
                        <span className={`text-2xl md:text-3xl font-mono transition-opacity duration-500 ${cinematicState === 'header' ? 'opacity-100' : 'opacity-30'}`}>
                            <span className="text-jwt-header font-bold">{truncate(parts[0])}</span>
                        </span>
                        <AnimatePresence>
                            {cinematicState === 'header' && <FlowerBracket label="Analyzing Header" />}
                        </AnimatePresence>
                    </div>

                    <span className="text-2xl text-gray-600">.</span>

                    <div className="relative">
                        <span className={`text-2xl md:text-3xl font-mono transition-opacity duration-500 ${cinematicState === 'payload' ? 'opacity-100' : 'opacity-30'}`}>
                            <span className="text-jwt-payload font-bold">{truncate(parts[1])}</span>
                        </span>
                        <AnimatePresence>
                            {cinematicState === 'payload' && <FlowerBracket label="Scanning Payload" />}
                        </AnimatePresence>
                    </div>

                    <span className="text-2xl text-gray-600">.</span>

                    <div className="relative">
                        <span className={`text-2xl md:text-3xl font-mono transition-opacity duration-500 ${cinematicState === 'signature' ? 'opacity-100' : 'opacity-30'}`}>
                            <span className="text-jwt-signature font-bold">{truncate(parts[2])}</span>
                        </span>
                         <AnimatePresence>
                            {cinematicState === 'signature' && <FlowerBracket label="Verifying Signature" />}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef}
        className={`flex-1 space-y-8 pb-32 scroll-smooth transition-opacity duration-500 overflow-y-auto
            ${cinematicState !== 'docked' && cinematicState !== 'idle' ? 'opacity-0' : 'opacity-100'}
        `}
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded bg-claude-accent flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-claude-accent/20">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'bg-claude-surface border border-claude-border rounded-2xl rounded-tr-sm p-4' : ''}`}>
               {msg.role === 'assistant' ? (
                 <div className="markdown-content text-sm text-claude-text font-serif leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-3 text-sm text-claude-text font-serif leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-claude-subtext italic">{children}</em>,
                        code: ({children}) => <code className="text-xs text-claude-accent bg-claude-surface px-1.5 py-0.5 rounded font-mono">{children}</code>,
                        pre: ({children}) => <pre className="text-xs bg-claude-bg border border-claude-border rounded-lg p-3 overflow-x-auto font-mono mb-3">{children}</pre>,
                        ul: ({children}) => <ul className="list-disc ml-5 mb-3 space-y-1 text-sm text-claude-text font-serif">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal ml-5 mb-3 space-y-1 text-sm text-claude-text font-serif">{children}</ol>,
                        li: ({children}) => <li className="text-sm text-claude-text font-serif">{children}</li>,
                        a: ({children, href}) => <a href={href} className="text-claude-accent underline hover:text-claude-accent/80">{children}</a>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-claude-accent pl-4 italic text-claude-subtext mb-3">{children}</blockquote>,
                        h1: ({children}) => <h1 className="text-base font-serif font-semibold text-claude-text mb-3 mt-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-serif font-semibold text-claude-text mb-2 mt-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-serif font-medium text-claude-text mb-2 mt-3">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                 </div>
               ) : (
                 <div className="text-sm text-claude-text font-sans">{msg.content}</div>
               )}
               {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                 <div className="mt-4 pt-3 border-t border-claude-border/50">
                    <div className="flex items-center gap-2 text-[10px] text-claude-subtext mb-2 font-mono uppercase tracking-wider font-bold">
                        <BookOpen size={10} /> <span>Context</span>
                    </div>
                    {msg.sources.map((s, i) => <div key={i} className="text-xs text-claude-subtext/70 bg-claude-bg p-2 rounded truncate">{s.slice(0, 80)}...</div>)}
                 </div>
               )}
            </div>
          </motion.div>
        ))}
        
        {/* Streaming Message Display */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-start"
          >
            <div className="w-8 h-8 rounded bg-claude-accent flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-claude-accent/20">
              <Bot size={16} className="text-white" />
            </div>
            <div className="max-w-[85%] space-y-2">
              <div className="markdown-content text-sm text-claude-text font-serif leading-relaxed">
                {streamingMessage ? (
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="mb-3 text-sm text-claude-text font-serif leading-relaxed">{children}</p>,
                      strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                      em: ({children}) => <em className="text-claude-subtext italic">{children}</em>,
                      code: ({children}) => <code className="text-xs text-claude-accent bg-claude-surface px-1.5 py-0.5 rounded font-mono">{children}</code>,
                      pre: ({children}) => <pre className="text-xs bg-claude-bg border border-claude-border rounded-lg p-3 overflow-x-auto font-mono mb-3">{children}</pre>,
                      ul: ({children}) => <ul className="list-disc ml-5 mb-3 space-y-1 text-sm text-claude-text font-serif">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal ml-5 mb-3 space-y-1 text-sm text-claude-text font-serif">{children}</ol>,
                      li: ({children}) => <li className="text-sm text-claude-text font-serif">{children}</li>,
                      a: ({children, href}) => <a href={href} className="text-claude-accent underline hover:text-claude-accent/80">{children}</a>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-claude-accent pl-4 italic text-claude-subtext mb-3">{children}</blockquote>,
                      h1: ({children}) => <h1 className="text-base font-serif font-semibold text-claude-text mb-3 mt-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-sm font-serif font-semibold text-claude-text mb-2 mt-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-sm font-serif font-medium text-claude-text mb-2 mt-3">{children}</h3>,
                    }}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                ) : (
                  <span className="text-claude-subtext text-sm"></span>
                )}
                {/* Streaming cursor */}
                <span className="inline-block w-2 h-4 align-middle bg-claude-accent ml-1 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className={`fixed bottom-4 left-64 right-0 z-40 px-2 transition-opacity duration-300 ${cinematicState !== 'docked' && cinematicState !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <div className="max-w-3xl mx-auto">
            {messages.length < 2 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {["Is this token expired?", "Explain 'sub'", "Security Check"].map((s) => (
                        <button key={s} onClick={(e) => handleAsk(e, s)} className="px-3 py-1.5 bg-claude-surface border border-claude-border rounded-full text-xs text-claude-subtext hover:bg-claude-input transition-colors shadow-lg">
                            {s}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-2">
              <form onSubmit={(e) => handleAsk(e)} className="relative group flex-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about this token..."
                    disabled={cinematicState !== 'idle' && cinematicState !== 'docked'}
                    className="w-full bg-claude-surface/95 backdrop-blur-md text-claude-text p-4 pr-14 rounded-2xl border border-claude-border focus:outline-none focus:border-claude-subtext focus:ring-1 focus:ring-claude-subtext font-sans shadow-xl"
                />
                <button type="submit" className="absolute right-3 top-3 p-2 bg-claude-accent text-white rounded-xl hover:opacity-90 transition-all shadow-md">
                    <Send size={18} />
                </button>
            </form>
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    clearMessages();
                    initialized.current = false;
                  }}
                  className="p-3 bg-claude-surface/95 backdrop-blur-md border border-claude-border rounded-xl hover:bg-claude-input transition-all shadow-xl group"
                  title="Clear chat history"
                >
                  <Trash2 size={18} className="text-claude-subtext group-hover:text-red-400 transition-colors" />
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}

// --- CINEMATIC EMPTY STATE CARDS ---

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in relative z-10">
        
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-claude-surface to-claude-bg border border-claude-border rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-claude-accent/10 relative group">
                <div className="absolute inset-0 bg-claude-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Lock size={36} className="text-claude-subtext group-hover:text-claude-text transition-colors duration-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif text-claude-text mb-6 tracking-tight">
                Awaiting Security Context
            </h1>
            <p className="text-claude-subtext text-lg max-w-lg mx-auto leading-relaxed">
                Paste a valid JWT in the top bar to chat with the AI security analyst. 
                <span className="block mt-2 opacity-50 text-sm font-mono">Waiting for input stream...</span>
            </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
            
            {/* Card 1: Security */}
            <motion.div 
                whileHover={{ y: -5, borderColor: "rgba(95, 176, 176, 0.4)" }}
                className="bg-claude-surface/50 border border-claude-border p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 backdrop-blur-sm"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 transform-gpu pointer-events-none">
                    <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="font-serif text-xl text-claude-text mb-3">Vulnerability Audit</h3>
                    <p className="text-sm text-claude-subtext leading-relaxed">
                        I analyze your token's <span className="text-green-400/80 font-mono text-xs border border-green-500/20 px-1 rounded">alg</span> header and signature strength to detect critical risks like the "None" algorithm or weak secrets.
                    </p>
                </div>
            </motion.div>

            {/* Card 2: Expiration */}
            <motion.div 
                whileHover={{ y: -5, borderColor: "rgba(95, 176, 176, 0.4)" }}
                className="bg-claude-surface/50 border border-claude-border p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 backdrop-blur-sm"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 transform-gpu pointer-events-none">
                    <Clock size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <Clock size={24} />
                    </div>
                    <h3 className="font-serif text-xl text-claude-text mb-3">Temporal Validity</h3>
                    <p className="text-sm text-claude-subtext leading-relaxed">
                        Instantly convert Unix timestamps (<span className="text-blue-400/80 font-mono text-xs border border-blue-500/20 px-1 rounded">exp</span>, <span className="text-blue-400/80 font-mono text-xs border border-blue-500/20 px-1 rounded">iat</span>) into human-readable dates to ensure session validity.
                    </p>
                </div>
            </motion.div>

            {/* Card 3: Claims */}
            <motion.div 
                whileHover={{ y: -5, borderColor: "rgba(95, 176, 176, 0.4)" }}
                className="bg-claude-surface/50 border border-claude-border p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 backdrop-blur-sm"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 transform-gpu pointer-events-none">
                    <Fingerprint size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                        <Fingerprint size={24} />
                    </div>
                    <h3 className="font-serif text-xl text-claude-text mb-3">Payload Inspection</h3>
                    <p className="text-sm text-claude-subtext leading-relaxed">
                        Decode standard claims like <span className="text-purple-400/80 font-mono text-xs border border-purple-500/20 px-1 rounded">sub</span> (Subject) and <span className="text-purple-400/80 font-mono text-xs border border-purple-500/20 px-1 rounded">iss</span> (Issuer) to understand user identity and scopes.
                    </p>
                </div>
            </motion.div>
        </div>
    </div>
);