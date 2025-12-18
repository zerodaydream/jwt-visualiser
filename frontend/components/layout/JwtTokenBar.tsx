'use client';
import { useJwtStore } from '@/store/jwtStore';
import { XCircle, CheckCircle, AlertCircle, Eraser, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { apiRequest } from '@/lib/api';

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
      const data = await apiRequest<any>('/api/v1/generate', {
        method: 'POST',
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
          
          {/* Overlay for coloring */}
          <div 
            ref={overlayRef}
            className="absolute inset-0 p-4 font-mono text-sm break-all pointer-events-none whitespace-pre-wrap leading-relaxed z-0 overflow-hidden" 
            aria-hidden="true"
          >
            {parts[0] ? <span className="text-jwt-header opacity-100">{parts[0]}</span> : <span className="text-gray-600 opacity-40">eyJ... (Header)</span>}
            {parts[0] && <span className="text-gray-500">.</span>}
            {parts[1] && <span className="text-jwt-payload opacity-100">{parts[1]}</span>}
            {parts[1] && parts[2] && <span className="text-gray-500">.</span>}
            {parts[2] && <span className="text-jwt-signature opacity-100">{parts[2]}</span>}
          </div>

          {/* Actual Input */}
          <textarea 
            ref={textareaRef}
            value={rawToken}
            onChange={(e) => setToken(e.target.value.replace(/\s/g, ''))}
            onPaste={handlePaste}
            onScroll={handleScroll}
            className="w-full bg-transparent text-transparent caret-claude-text p-4 font-mono text-sm resize-none focus:outline-none min-h-[80px] leading-relaxed relative z-10"
            placeholder="Paste your JWT token here..."
            spellCheck={false}
          />
          
          {/* ACTION BUTTONS (Absolute Top Right) */}
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            
            {/* Generate Sample Button */}
            {!rawToken && (
              <button 
                onClick={handleGenerateSample}
                disabled={generating}
                className="px-3 py-1.5 bg-claude-accent/10 text-claude-accent rounded-md hover:bg-claude-accent/20 transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                title="Generate Sample Token"
              >
                <Sparkles size={12} />
                {generating ? 'Generating...' : 'Try Sample'}
              </button>
            )}

            {/* Copy Button */}
            {rawToken && (
              <button 
                onClick={handleCopy}
                className="p-1.5 bg-claude-surface text-claude-subtext rounded-md hover:text-white hover:bg-claude-accent/20 transition-colors"
                title="Copy Token"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
            
            {/* Clear Button */}
            {rawToken && (
              <button 
                onClick={() => setToken('')}
                className="p-1.5 bg-claude-surface text-claude-subtext rounded-md hover:text-white hover:bg-red-900/30 transition-colors"
                title="Clear Token"
              >
                <Eraser size={14} />
              </button>
            )}

            {/* Validation Icon */}
            {rawToken && (
              <div className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                  isValidStructure ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'
              }`}>
                {isValidStructure ? <CheckCircle size={14} /> : <XCircle size={14} />}
              </div>
            )}
          </div>

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

      </div>
    </div>
  );
}
