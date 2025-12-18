'use client';
import { useJwtStore } from '@/store/jwtStore';
import { XCircle, CheckCircle, AlertCircle, Eraser, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

export function JwtTokenBar() {
  const { rawToken, setToken, isValidStructure, validationError } = useJwtStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setToken(text.replace(/\s/g, ''));
  };

  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = () => {
    if (rawToken) {
      navigator.clipboard.writeText(rawToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateSample = async () => {
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            sub: "1234567890",
            name: "John Doe",
            admin: true,
            iat: Math.floor(Date.now() / 1000)
          },
          secret: "a-string-secret-at-least-256-bits-long",
          algorithm: "HS256",
          expires_in_minutes: 60
        })
      });

      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
      }
    } catch (err) {
      console.error('Failed to generate sample token:', err);
    } finally {
      setGenerating(false);
    }
  };

  const parts = rawToken.split('.');

  return (
    <div className="sticky top-0 z-30 bg-claude-bg/95 backdrop-blur-sm border-b border-claude-border p-6 shadow-sm transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-2">
        
        {/* INPUT CONTAINER */}
        <div className={`relative group bg-claude-input rounded-xl border transition-all duration-300 overflow-hidden ${
            validationError 
                ? 'border-red-900/50 ring-1 ring-red-900/30' 
                : isValidStructure 
                    ? 'border-green-900/50 ring-1 ring-green-900/30' 
                    : 'border-claude-border focus-within:border-claude-subtext'
        }`}>
          
          {/* Overlay for coloring - syncs with textarea scroll */}
          <div 
            ref={overlayRef}
            className="absolute inset-0 p-4 pr-24 font-mono text-sm break-all pointer-events-none whitespace-pre-wrap leading-relaxed z-0 overflow-hidden" 
            aria-hidden="true"
          >
            {parts[0] ? <span className="text-jwt-header opacity-100">{parts[0]}</span> : <span className="text-gray-600 opacity-40">eyJ... (Header)</span>}
            {parts[0] && <span className="text-gray-500">.</span>}
            {parts[1] && <span className="text-jwt-payload opacity-100">{parts[1]}</span>}
            {parts[1] && parts[2] && <span className="text-gray-500">.</span>}
            {parts[2] && <span className="text-jwt-signature opacity-100">{parts[2]}</span>}
          </div>

          {/* Actual Input - with vertical scroll */}
          <textarea 
            ref={textareaRef}
            value={rawToken}
            onChange={(e) => setToken(e.target.value.replace(/\s/g, ''))}
            onPaste={handlePaste}
            onScroll={handleScroll}
            placeholder="Paste your JWT token here..."
            className="w-full bg-transparent text-transparent caret-claude-text p-4 pr-24 font-mono text-sm resize-none focus:outline-none min-h-[80px] max-h-[120px] leading-relaxed relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-claude-border scrollbar-track-transparent"
            spellCheck={false}
          />
          
          {/* STATUS ICONS (Absolute Top Right) */}
          <div className="absolute top-3 right-3 z-20 flex gap-1.5">
            
            {/* Validation Icon */}
            {rawToken && (
                <div className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                    isValidStructure ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'
                }`}>
                    {isValidStructure ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </div>
            )}
          </div>

          {/* SMALL ACTION BUTTONS (Bottom Right) */}
          {rawToken && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-2 right-2 z-20 flex gap-1"
            >
              <button
                onClick={handleCopy}
                className="p-1.5 bg-claude-surface hover:bg-claude-bg border border-claude-border rounded-md transition-all group/btn shadow-sm hover:shadow"
                title="Copy Token"
              >
                {copied ? (
                  <Check size={12} className="text-green-500" />
                ) : (
                  <Copy size={12} className="text-claude-subtext group-hover/btn:text-claude-text group-hover/btn:scale-110 transition-transform" />
                )}
              </button>

              <button
                onClick={() => setToken('')}
                className="p-1.5 bg-claude-surface hover:bg-red-900/20 border border-claude-border hover:border-red-900/30 rounded-md transition-all group/btn shadow-sm hover:shadow"
                title="Clear Token"
              >
                <Eraser size={12} className="text-claude-subtext group-hover/btn:text-red-400 group-hover/btn:scale-110 transition-transform" />
              </button>
            </motion.div>
          )}

        </div>

        {/* ERROR MESSAGE (Slides down) */}
        <AnimatePresence>
            {validationError && rawToken && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                >
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 px-3 py-2 rounded-lg border border-red-900/30">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{validationError}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* GENERATE SAMPLE TOKEN BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerateSample}
            disabled={generating}
            className="text-xs px-3 py-2 bg-claude-surface hover:bg-claude-input border border-claude-border rounded-lg text-claude-subtext hover:text-claude-text transition-all flex items-center gap-2 group/sample disabled:opacity-50 shadow-sm hover:shadow"
            title="Generate a sample JWT token for testing"
          >
            <Sparkles size={13} className={`group-hover/sample:text-claude-accent transition-colors ${generating ? 'animate-spin' : ''}`} />
            <span className="font-medium">Generate Sample Token</span>
          </button>
        </div>

      </div>
    </div>
  );
}