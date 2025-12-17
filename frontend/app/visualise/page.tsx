'use client';
import { useState, useEffect, useRef } from 'react';
import { useJwtStore } from '@/store/jwtStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ArrowDown, ArrowUp, Binary, MousePointerClick, ChevronDown, ChevronRight, Lock, FileJson, ArrowRight, Layers, Eye, Fingerprint, ShieldCheck } from 'lucide-react';

// --- UTILITY FUNCTIONS ---

// Decode base64url to string (JWT uses base64url encoding, not standard base64)
const base64UrlDecode = (str: string): string => {
  try {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode base64 to binary string
    const binaryString = atob(base64);
    // Convert binary string to UTF-8 string
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    // Return empty JSON object for invalid base64
    throw error;
  }
};

// --- SHARED COMPONENTS ---

const ScrambleText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [display, setDisplay] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let counter = 0;
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplay(text.split('').map((char, index) => index < counter ? char : chars[Math.floor(Math.random() * chars.length)]).join(''));
        counter += 1;
        if (counter > text.length) clearInterval(interval);
      }, 5);
    }, delay * 1000);
    return () => { clearTimeout(startTimeout); clearInterval(interval); };
  }, [text, delay]);
  return <span className="font-mono text-claude-accent">{display}</span>;
};

// 2. The "Flower Bracket" Connector
const CurlyBrace = () => (
    <svg width="40" height="100%" viewBox="0 0 40 100" preserveAspectRatio="none" className="text-claude-subtext opacity-30">
        <path d="M40,0 C20,0 20,20 20,20 L20,40 C20,50 10,50 0,50 C10,50 20,50 20,60 L20,80 C20,80 20,100 40,100" 
              fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    </svg>
);

// 3. Circular Progress Timer
const ProgressRing = ({ duration, isPlaying, onComplete }: { duration: number, isPlaying: boolean, onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const onCompleteRef = useRef(onComplete);
    const hasStarted = useRef(false);
    
    // Keep the ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);
    
    useEffect(() => {
        if (!isPlaying || duration === 0) {
            return;
        }
        
        // Only reset to 0 on first start of this step
        if (!hasStarted.current) {
            setProgress(0);
            hasStarted.current = true;
        }
        
        let completed = false;
        const intervalTime = 50;
        const step = 100 / (duration / intervalTime);
        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + step;
                if (next >= 100 && !completed) {
                    completed = true;
                    clearInterval(timer);
                    // Defer the callback to avoid updating state during render
                    setTimeout(() => onCompleteRef.current(), 0);
                    return 100;
                }
                return next >= 100 ? 100 : next;
            });
        }, intervalTime);
        
        return () => {
            clearInterval(timer);
        };
    }, [isPlaying, duration]);

    return (
        <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle cx="16" cy="16" r="14" className="stroke-claude-border fill-none" strokeWidth="3" />
                <circle cx="16" cy="16" r="14" className="stroke-claude-accent fill-none transition-all duration-100 ease-linear" strokeWidth="3" strokeDasharray={88} strokeDashoffset={88 - (88 * progress) / 100} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
            </div>
        </div>
    );
};

// 4. Enhanced Corruption Warning Component with Visual Diagrams
const CorruptionWarning = ({ partName, type = 'corrupted' }: { partName: string; type?: 'corrupted' | 'missing' | 'tampered' | 'invalid' }) => {
    const [showDetails, setShowDetails] = useState(true);
    
    const messages = {
        corrupted: {
            title: 'Data Corruption Detected',
            description: `The ${partName} could not be decoded. This typically occurs when the base64url encoding is invalid or incomplete.`,
            reasons: [
                'Token was modified or truncated',
                'Invalid base64url characters detected',
                'Incomplete encoding sequence',
            ]
        },
        missing: {
            title: 'Missing Component',
            description: `The ${partName} is missing or too short to be valid.`,
            reasons: [
                'Token structure is incomplete',
                'Expected three parts separated by dots',
                'Token may have been partially copied',
            ]
        },
        tampered: {
            title: 'Potential Tampering',
            description: `The ${partName} appears to have been modified.`,
            reasons: [
                'Token integrity compromised',
                'Do not trust this token for authentication',
                'Generate a new token from a trusted source',
            ]
        },
        invalid: {
            title: 'Invalid Signature',
            description: `The ${partName} is present but invalid. This means the token has been tampered with or corrupted.`,
            reasons: [
                'Signature does not match the expected format',
                'Token content was modified after signing',
                'Signature verification would fail on the server',
            ]
        }
    };

    const message = messages[type];

    // Visual Diagram Components
    const CorruptedDataFlow = () => (
        <div className="relative h-32 flex items-center justify-center">
            {/* Valid Token Flow */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between opacity-40">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 0.4 }}
                    className="flex items-center gap-2 text-xs"
                >
                    <div className="w-20 h-8 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center text-green-400 font-mono text-[10px]">
                        Valid
                    </div>
                    <ArrowRight className="text-green-500" size={16} />
                    <div className="w-20 h-8 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center text-green-400 font-mono text-[10px]">
                        Decode
                    </div>
                    <ArrowRight className="text-green-500" size={16} />
                    <div className="w-20 h-8 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center text-green-400 font-mono text-[10px]">
                        ✓ JSON
                    </div>
                </motion.div>
            </div>

            {/* Broken Token Flow */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 text-xs w-full"
                >
                    <div className="w-20 h-10 bg-red-500/20 border-2 border-red-500/40 rounded flex items-center justify-center text-red-400 font-mono text-[10px] relative overflow-hidden">
                        <motion.div
                            animate={{ x: [0, 100, -100, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"
                        />
                        <span className="relative z-10">Corrupt</span>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <ArrowRight className="text-red-500" size={16} />
                    </motion.div>
                    <div className="w-20 h-10 bg-red-500/20 border-2 border-red-500/40 rounded flex items-center justify-center text-red-400 font-mono text-[10px]">
                        Decode
                    </div>
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-red-500"
                        >
                            ✕
                        </motion.div>
                    </div>
                    <div className="w-20 h-10 bg-red-900/20 border-2 border-red-500/60 border-dashed rounded flex items-center justify-center text-red-300 font-mono text-[10px]">
                        ERROR
                    </div>
                </motion.div>
            </div>

            {/* Connecting Line with Break */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                <motion.path
                    d="M 60 20 L 180 20"
                    stroke="#22c55e"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
                <motion.path
                    d="M 60 100 L 180 100"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                />
            </svg>
        </div>
    );

    const MissingComponentDiagram = () => (
        <div className="flex items-center justify-center gap-4 my-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="text-xs text-gray-500 mb-2">Expected</div>
                <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-green-500/30">
                    <div className="w-12 h-8 bg-jwt-header/30 border border-jwt-header rounded text-[10px] flex items-center justify-center text-jwt-header">
                        H
                    </div>
                    <span className="text-white">.</span>
                    <div className="w-12 h-8 bg-jwt-payload/30 border border-jwt-payload rounded text-[10px] flex items-center justify-center text-jwt-payload">
                        P
                    </div>
                    <span className="text-white">.</span>
                    <div className="w-12 h-8 bg-jwt-signature/30 border border-jwt-signature rounded text-[10px] flex items-center justify-center text-jwt-signature">
                        S
                    </div>
                </div>
            </motion.div>

            <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-red-500 text-2xl"
            >
                ≠
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
            >
                <div className="text-xs text-orange-400 mb-2">Current</div>
                <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-red-500/30">
                    <div className="w-12 h-8 bg-jwt-header/30 border border-jwt-header rounded text-[10px] flex items-center justify-center text-jwt-header">
                        H
                    </div>
                    <span className="text-white">.</span>
                    <div className="w-12 h-8 bg-jwt-payload/30 border border-jwt-payload rounded text-[10px] flex items-center justify-center text-jwt-payload">
                        P
                    </div>
                    <span className="text-white">.</span>
                    <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-12 h-8 bg-red-500/20 border-2 border-red-500 border-dashed rounded text-[10px] flex items-center justify-center text-red-400"
                    >
                        ✕
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );

    const TamperedVisualization = () => (
        <div className="my-6 space-y-4">
            <div className="flex items-center justify-center gap-8">
                {/* Original */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 text-center"
                >
                    <div className="text-xs text-green-400 mb-2 font-bold uppercase tracking-wider">Original Data</div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="font-mono text-xs text-green-300 mb-2">eyJhbGciOi...</div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <Lock size={14} className="text-green-400" />
                            <span className="text-xs text-green-400">Intact</span>
                        </div>
                    </div>
                </motion.div>

                {/* Arrow with warning */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center gap-2"
                >
                    <ArrowRight className="text-orange-500" size={24} />
                    <span className="text-xs text-orange-400 font-bold">Modified</span>
                </motion.div>

                {/* Tampered */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 text-center"
                >
                    <div className="text-xs text-red-400 mb-2 font-bold uppercase tracking-wider">Altered Data</div>
                    <div className="bg-red-500/10 border-2 border-red-500/40 rounded-lg p-4 relative overflow-hidden">
                        {/* Glitch effect */}
                        <motion.div
                            animate={{ 
                                x: [-100, 100],
                                opacity: [0, 0.3, 0]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-red-500/20"
                        />
                        <div className="font-mono text-xs text-red-300 mb-2 relative">
                            eyJhb<span className="text-red-500 font-bold animate-pulse">X</span>ciOi...
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                <ShieldCheck size={14} className="text-red-400" />
                            </motion.div>
                            <span className="text-xs text-red-400">Compromised</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Warning Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-center"
            >
                <div className="flex items-center justify-center gap-2 text-red-300 text-xs">
                    <Binary size={14} />
                    <span>Even a single character change breaks the entire token</span>
                </div>
            </motion.div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="my-8 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/10 border-2 border-orange-500/30 rounded-2xl backdrop-blur-sm relative overflow-hidden"
        >
            {/* Animated background effects */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10 p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Animated Warning Icon */}
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, -5, 5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex-shrink-0 mt-1"
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-500/50 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
                                <ShieldCheck className="text-orange-300 relative z-10" size={28} />
                            </div>
                        </motion.div>
                        
                        {/* Title and Description */}
                        <div className="flex-1">
                            <motion.h4 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-orange-300 font-bold text-lg uppercase tracking-wider mb-2 flex items-center gap-2"
                            >
                                {message.title}
                                <motion.span
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-red-400"
                                >
                                    ⚠
                                </motion.span>
                            </motion.h4>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-claude-text text-sm leading-relaxed"
                            >
                                {message.description}
                            </motion.p>
                        </div>
                    </div>
                </div>

                {/* Visual Diagram Section */}
                <div className="bg-black/30 rounded-xl p-6 mb-6 border border-orange-500/20">
                    {type === 'corrupted' && <CorruptedDataFlow />}
                    {type === 'missing' && <MissingComponentDiagram />}
                    {type === 'tampered' && <TamperedVisualization />}
                    {type === 'invalid' && <TamperedVisualization />}
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Reasons Grid */}
                            <div className="grid md:grid-cols-3 gap-3 mb-6">
                                {message.reasons.map((reason, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-orange-400 text-lg">•</span>
                                            <span className="text-xs text-claude-subtext">{reason}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Educational Tip */}
                            <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500/50 rounded-r-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div className="flex-1">
                                        <div className="text-xs text-orange-300 font-bold mb-1 uppercase tracking-wider">
                                            Educational Insight
                                        </div>
                                        <p className="text-xs text-claude-subtext leading-relaxed">
                                            JWTs use <span className="text-orange-300 font-mono">base64url</span> encoding, which is case-sensitive and requires exact formatting. 
                                            Any modification—even a single character—invalidates the token's cryptographic signature.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Button */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full mt-4 py-2 text-xs text-orange-400/70 hover:text-orange-300 transition-colors flex items-center justify-center gap-2"
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                    <motion.div
                        animate={{ rotate: showDetails ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown size={14} />
                    </motion.div>
                </button>
            </div>
        </motion.div>
    );
};

// --- DECODE VISUALIZERS (Existing) ---

const Base64DecodeMicroscope = ({ chunk }: { chunk: string }) => {
    // Hardcoded educational visual for "eyJh" -> "{"
    const steps = [
        { char: 'e', index: 30, bits: '011110' },
        { char: 'y', index: 50, bits: '110010' },
        { char: 'J', index: 9,  bits: '001001' },
        { char: 'h', index: 33, bits: '100001' },
    ];
    
    return (
        <div className="my-8 p-6 bg-black/40 rounded-xl border border-claude-border overflow-hidden">
            <div className="text-xs text-claude-subtext mb-4 uppercase tracking-widest font-bold text-center">Base64 Decode (6-bit to 8-bit)</div>
            <div className="grid grid-cols-4 gap-2 mb-8 relative">
                {steps.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.5 }} className="flex flex-col items-center">
                        <div className="w-10 h-10 border border-jwt-header text-jwt-header flex items-center justify-center rounded mb-2 font-mono text-xl bg-jwt-header/10">{s.char}</div>
                        <div className="font-mono text-xs text-claude-accent bg-claude-surface px-1 py-0.5 rounded border border-claude-border">{s.bits}</div>
                    </motion.div>
                ))}
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 2.5, duration: 1 }} className="absolute bottom-[-20px] left-4 right-4 h-4 border-b border-l border-r border-gray-600 rounded-b-lg opacity-50" />
            </div>
             <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3 }} className="mt-6 flex justify-center gap-4">
                 {['{', '"', 'a'].map((c, i) => (
                     <div key={i} className="w-12 h-12 bg-white text-black font-mono text-xl font-bold flex items-center justify-center rounded shadow-[0_0_15px_rgba(255,255,255,0.3)]">{c}</div>
                 ))}
             </motion.div>
        </div>
    );
};

// --- ENCODE VISUALIZERS (NEW) ---

const Base64EncodeMicroscope = () => {
    // Hardcoded educational visual for "{" -> "ey"
    // ASCII '{' is 123 (01111011)
    return (
        <div className="my-8 p-6 bg-black/40 rounded-xl border border-claude-border overflow-hidden relative">
            <div className="text-xs text-claude-subtext mb-6 uppercase tracking-widest font-bold text-center">Base64 Encode (8-bit to 6-bit)</div>
            
            <div className="flex justify-center gap-8 mb-12">
                {/* Input Char */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase">ASCII Input</span>
                    <div className="w-14 h-14 bg-white text-black font-mono text-2xl font-bold flex items-center justify-center rounded shadow-lg">
                        {"{"}
                    </div>
                    <div className="font-mono text-xs text-gray-400">Decimal: 123</div>
                </motion.div>
            </div>

            {/* The Bit Split Animation */}
            <div className="flex flex-col items-center gap-4 mb-8">
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="font-mono text-lg tracking-[0.2em] text-white">
                    01111011
                 </motion.div>
                 
                 <ArrowDown className="text-gray-600" />
                 
                 {/* Regrouping Logic */}
                 <div className="flex gap-4">
                     <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2 }} className="flex flex-col items-center p-3 bg-claude-surface border border-claude-border rounded-lg">
                        <span className="text-[10px] text-gray-500 mb-1">First 6 bits</span>
                        <span className="font-mono text-claude-accent text-lg font-bold">011110</span>
                        <span className="text-xs text-gray-400 mt-1">Idx: 30</span>
                        <div className="mt-2 w-8 h-8 bg-jwt-header/20 text-jwt-header border border-jwt-header rounded flex items-center justify-center font-bold">e</div>
                     </motion.div>

                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }} className="flex flex-col items-center p-3 bg-claude-surface border border-claude-border rounded-lg opacity-50">
                        <span className="text-[10px] text-gray-500 mb-1">Remaining 2..</span>
                        <span className="font-mono text-claude-accent text-lg font-bold">11....</span>
                        <span className="text-xs text-gray-400 mt-1">Next...</span>
                     </motion.div>
                 </div>
            </div>
            
            <div className="text-center text-[10px] text-gray-500 max-w-sm mx-auto">
                Base64 takes 8-bit bytes (ASCII) and regroups them into 6-bit chunks. Each 6-bit chunk maps to one of 64 characters.
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---

export default function VisualizePage() {
  const { rawToken, isValidStructure } = useJwtStore();
  
  // State
  const [mode, setMode] = useState<'decode' | 'encode'>('decode');
  const [step, setStep] = useState(0); 
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for auto-scroll
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Derived Data
  const parts = rawToken ? rawToken.split('.') : [];
  
  // Safe decode with error handling for incomplete/invalid tokens
  const safeDecodeAndStringify = (part: string): { decoded: string; isValid: boolean; isEmpty: boolean } => {
    try {
      const decoded = base64UrlDecode(part);
      const parsed = JSON.parse(decoded);
      const stringified = JSON.stringify(parsed, null, 2);
      const isEmpty = Object.keys(parsed).length === 0;
      return { decoded: stringified, isValid: true, isEmpty };
    } catch (error) {
      // Return empty JSON object for invalid/incomplete tokens
      return { decoded: '{}', isValid: false, isEmpty: true };
    }
  };
  
  const headerResult = parts[0] ? safeDecodeAndStringify(parts[0]) : { decoded: '{}', isValid: false, isEmpty: true };
  const payloadResult = parts[1] ? safeDecodeAndStringify(parts[1]) : { decoded: '{}', isValid: false, isEmpty: true };
  
  const decodedHeader = headerResult.decoded;
  const decodedPayload = payloadResult.decoded;
  const isHeaderCorrupted = !headerResult.isValid;
  const isPayloadCorrupted = !payloadResult.isValid;
  
  // Better signature detection
  const hasSignaturePart = parts.length >= 3 && parts[2];
  const isSignatureMissing = !hasSignaturePart;
  
  // Check if signature is invalid (exists but is corrupted/tampered)
  // A typical JWT signature is 40+ characters. If it's present but very short or has invalid chars, it's tampered
  const isSignatureInvalid = hasSignaturePart && (
    parts[2].length < 20 || // Too short to be a valid signature
    !/^[A-Za-z0-9_-]+$/.test(parts[2]) // Contains invalid base64url characters
  );
  
  // If header or payload is corrupted, the signature would be invalid even if it looks correct
  const isTokenTampered = (isHeaderCorrupted || isPayloadCorrupted) && hasSignaturePart;

  // Step Durations (ms) - for decode mode with manual progression
  const STEP_DURATIONS: Record<number, number> = mode === 'decode' ? {
      1: 5000,  // Split -> Header
      2: 8000,  // Header -> Payload
      3: 8000,  // Payload -> Signature
      4: 10000  // Signature Verification
  } : {};

  const currentDuration = STEP_DURATIONS[step] || 0;

  const nextStep = () => {
      if (step < 4) {
          setStep(prev => prev + 1);
      } else {
          setIsPlaying(false);
          setIsPaused(false);
      }
  };

  const handleStart = () => {
      setStep(1);
      setIsPaused(false);
      setIsPlaying(true);
  };

  // --- TIMELINE LOGIC ---
  useEffect(() => {
    if (!isPlaying) return;
    
    // For encode mode, use automatic timing
    if (mode === 'encode') {
      const timelines = [100, 5000, 14000, 20000]; // Encode Steps
    const timers = timelines.map((time, index) => 
        setTimeout(() => setStep(index + 1), time)
    );
    return () => timers.forEach(clearTimeout);
    }
    // Decode mode uses manual progression with ProgressRing
  }, [isPlaying, mode]);

  // Auto-Scroll
  useEffect(() => {
      if (step > 0 && stepRefs.current[step]) {
          stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [step]);

  const handleReset = () => {
      setIsPlaying(false);
      setIsPaused(false);
    setStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchMode = (newMode: 'decode' | 'encode') => {
      setMode(newMode);
      handleReset();
  };

  if (!rawToken || !isValidStructure) return <div className="p-20 text-center text-claude-subtext">No Token Found</div>;

  return (
    <div className="max-w-5xl mx-auto pb-48">
        
        {/* --- STICKY CONTROL BAR --- */}
        <div className="sticky top-0 z-50 bg-claude-bg/95 backdrop-blur border-b border-claude-border px-4 py-2 mb-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
                {/* Left: Step indicator */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-claude-surface border border-claude-border rounded flex items-center justify-center font-serif text-sm font-bold text-claude-text">
                        {step === 0 ? '0' : step}
                    </div>
                    <div className="text-xs font-bold text-claude-text uppercase tracking-wide">
                        {mode === 'decode' && step === 0 && 'Ready'}
                        {mode === 'decode' && step === 1 && 'Splitting'}
                        {mode === 'decode' && step === 2 && 'Header'}
                        {mode === 'decode' && step === 3 && 'Payload'}
                        {mode === 'decode' && step === 4 && 'Signature'}
                        {mode === 'encode' && step === 0 && 'Ready'}
                        {mode === 'encode' && step >= 1 && `Step ${step}/4`}
                    </div>
                </div>

                {/* Center: Mode Toggle */}
                <div className="bg-claude-surface p-0.5 rounded-md border border-claude-border flex gap-0.5">
                    <button 
                        onClick={() => switchMode('decode')}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${mode === 'decode' ? 'bg-claude-input text-white shadow-sm' : 'text-claude-subtext hover:text-claude-text'}`}
                    >
                        <Eye size={11} /> Decode
                    </button>
                    <button 
                        onClick={() => switchMode('encode')}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${mode === 'encode' ? 'bg-claude-input text-white shadow-sm' : 'text-claude-subtext hover:text-claude-text'}`}
                    >
                        <Layers size={11} /> Encode
                    </button>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                    {mode === 'decode' && step > 0 && step <= 4 && (
                        <>
                            <button onClick={() => setIsPaused(!isPaused)} className="p-1 hover:bg-claude-surface rounded-full transition-colors">
                                <ProgressRing 
                                    key={step} 
                                    duration={currentDuration} 
                                    isPlaying={!isPaused && isPlaying} 
                                    onComplete={nextStep} 
                                />
                            </button>
                            {step < 4 && (
                                <button onClick={nextStep} className="px-2.5 py-1 bg-claude-surface border border-claude-border hover:bg-claude-input rounded text-[10px] font-medium flex items-center gap-1 transition-all">
                                    Next <ChevronRight size={10} />
                                </button>
                            )}
                        </>
                    )}
                    
                    {step === 0 && (
                        <button onClick={mode === 'decode' ? handleStart : () => setIsPlaying(true)} className="flex items-center gap-1 px-3 py-1 bg-claude-accent hover:bg-claude-accent/90 text-white rounded-full shadow-lg transition-all font-medium text-[10px]">
                            <Play size={12} fill="currentColor" /> Start
                        </button>
                    )}
                    
                    {step > 0 && (
                        <button onClick={handleReset} className="p-1 text-claude-subtext hover:text-white transition-colors" title="Reset">
                            <RotateCcw size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* ========================================================================= */}
        {/* DECODE FLOW                                 */}
        {/* ========================================================================= */}
        {mode === 'decode' && (
            <div className="space-y-40 px-4">
            
            {/* --- STEP 1: SPLIT --- */}
            <div ref={el => { stepRefs.current[1] = el; }} className={`transition-all duration-1000 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-20 blur-sm'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl font-mono font-bold text-claude-subtext/20">01</div>
                    <h2 className="text-2xl font-serif text-claude-text">The Split</h2>
                    </div>

                <div className="bg-claude-surface border border-claude-border rounded-2xl p-8">
                    <p className="text-claude-subtext mb-8 font-serif max-w-2xl">
                        A JWT is not a single string. It's three separate data parts connected by dots. We break them apart to process them individually.
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-center font-mono text-sm break-all">
                         <motion.div initial={false} animate={step >= 1 ? { x: -20, rotate: -2 } : { x: 0 }} className="bg-jwt-header/10 text-jwt-header p-4 rounded-lg border border-jwt-header/30 w-full md:w-auto relative group">
                            {parts[0].substring(0, 15)}...
                            <span className="absolute -top-3 left-4 text-[10px] bg-claude-bg px-2 border border-jwt-header/30 rounded text-jwt-header uppercase font-bold">Header</span>
                            </motion.div>

                         <motion.div animate={step >= 1 ? { opacity: 0, scale: 0 } : { opacity: 1 }} className="text-4xl text-gray-600">.</motion.div>

                         <motion.div initial={false} animate={step >= 1 ? { y: 20, scale: 1.05 } : { y: 0 }} className="bg-jwt-payload/10 text-jwt-payload p-4 rounded-lg border border-jwt-payload/30 w-full md:w-auto shadow-2xl relative">
                            {parts[1].substring(0, 15)}...
                            <span className="absolute -top-3 left-4 text-[10px] bg-claude-bg px-2 border border-jwt-payload/30 rounded text-jwt-payload uppercase font-bold">Payload</span>
                            </motion.div>

                         <motion.div animate={step >= 1 ? { opacity: 0, scale: 0 } : { opacity: 1 }} className="text-4xl text-gray-600">.</motion.div>

                         <motion.div initial={false} animate={step >= 1 ? { x: 20, rotate: 2 } : { x: 0 }} className="bg-jwt-signature/10 text-jwt-signature p-4 rounded-lg border border-jwt-signature/30 w-full md:w-auto relative">
                            {parts[2] ? parts[2].substring(0, 15) + '...' : 'Missing'}
                            <span className="absolute -top-3 left-4 text-[10px] bg-claude-bg px-2 border border-jwt-signature/30 rounded text-jwt-signature uppercase font-bold">Signature</span>
                            </motion.div>
                        </div>
                    </div>
            </div>

            {/* --- STEP 2: HEADER --- */}
            <div ref={el => { stepRefs.current[2] = el; }} className={`transition-all duration-1000 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-20 blur-sm'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl font-mono font-bold text-jwt-header/20">02</div>
                    <h2 className="text-2xl font-serif text-claude-text">Header Decode</h2>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
                     {/* Left: Encoded */}
                     <div className="text-right space-y-2">
                        <div className="text-xs font-mono uppercase text-jwt-header font-bold">Base64Url Input</div>
                        <div className="bg-claude-surface p-4 rounded-lg border border-claude-border font-mono text-xs text-claude-subtext break-all border-l-4 border-l-jwt-header shadow-sm overflow-hidden">
                            <div className="break-words">{parts[0]}</div>
                        </div>
                     </div>

                     {/* Middle: Brace */}
                     <div className="h-32 flex items-center justify-center w-16">
                         <CurlyBrace />
                     </div>

                     {/* Right: Decoded */}
                     <div className="space-y-2">
                        <div className="text-xs font-mono uppercase text-white flex items-center gap-2 font-bold">
                            <FileJson size={14} /> JSON Object
                        </div>
                        <div className="bg-black/50 p-4 rounded-lg border border-claude-border font-mono text-sm text-claude-text shadow-2xl relative overflow-x-auto overflow-y-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-jwt-header" />
                            <pre className="relative z-10 pl-2 whitespace-pre">
                                {step >= 2 ? <ScrambleText text={decodedHeader} delay={0.5} /> : ''}
                            </pre>
                        </div>
                     </div>
                </div>
                
                {/* Corruption Warning for Header */}
                {step >= 2 && isHeaderCorrupted && (
                    <CorruptionWarning partName="Header" type="corrupted" />
                )}
            </div>

            {/* --- STEP 3: PAYLOAD --- */}
            <div ref={el => { stepRefs.current[3] = el; }} className={`transition-all duration-1000 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-20 blur-sm'}`}>
                <div className="flex items-center gap-4 mb-6">
                     <div className="text-4xl font-mono font-bold text-jwt-payload/20">03</div>
                     <h2 className="text-2xl font-serif text-claude-text">Payload Decode</h2>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
                     {/* Left: Encoded */}
                     <div className="text-right space-y-2">
                        <div className="text-xs font-mono uppercase text-jwt-payload font-bold">Base64Url Input</div>
                        <div className="bg-claude-surface p-4 rounded-lg border border-claude-border font-mono text-xs text-claude-subtext break-all border-l-4 border-l-jwt-payload shadow-sm overflow-hidden">
                            <div className="break-words">{parts[1]}</div>
                        </div>
                     </div>

                     {/* Middle: Brace */}
                     <div className="h-48 flex items-center justify-center w-16">
                         <CurlyBrace />
                     </div>

                     {/* Right: Decoded */}
                     <div className="space-y-2">
                        <div className="text-xs font-mono uppercase text-white flex items-center gap-2 font-bold">
                            <Fingerprint size={14} /> Claims & Data
                        </div>
                        <div className="bg-black/50 p-4 rounded-lg border border-claude-border font-mono text-sm text-claude-text shadow-2xl relative overflow-x-auto overflow-y-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-jwt-payload" />
                            <pre className="relative z-10 pl-2 whitespace-pre">
                                {step >= 3 ? <ScrambleText text={decodedPayload} delay={0.5} /> : ''}
                            </pre>
                        </div>
                     </div>
                </div>
                
                {/* Corruption Warning for Payload */}
                {step >= 3 && isPayloadCorrupted && (
                    <CorruptionWarning partName="Payload" type="corrupted" />
                )}
            </div>

            {/* --- STEP 4: SIGNATURE (NEW DETAILED VISUAL) --- */}
            <div ref={el => { stepRefs.current[4] = el; }} className={`transition-all duration-1000 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-20 blur-sm'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl font-mono font-bold text-jwt-signature/20">04</div>
                    <h2 className="text-2xl font-serif text-claude-text">Signature Verification</h2>
                </div>

                <div className="bg-gradient-to-br from-[#1a2e2e] to-black border border-jwt-signature/30 rounded-2xl p-10 relative overflow-hidden group">
                    
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-jwt-signature/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-jwt-signature/20 transition-all duration-1000" />

                    <div className="grid md:grid-cols-2 gap-12 relative z-10">
                        
                        {/* LEFT: THE HASHING MACHINE */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-jwt-signature font-mono text-xs uppercase tracking-widest font-bold">
                                <Binary size={14} /> The Algorithm
                            </div>
                            
                            {/* Input Stack */}
                            <div className="space-y-2">
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }} 
                                    animate={step >= 4 ? { x: 0, opacity: 1 } : {}} 
                                    transition={{ delay: 0.2 }} 
                                    className={`p-3 rounded text-xs font-mono truncate ${
                                        isHeaderCorrupted 
                                            ? 'bg-red-500/20 border-2 border-red-500/40 border-dashed text-red-400'
                                            : 'bg-jwt-header/20 border border-jwt-header/30 text-jwt-header'
                                    }`}
                                >
                                    <span className="opacity-50 select-none mr-2">1.</span> {parts[0].substring(0,20)}...
                                    {isHeaderCorrupted && <span className="ml-2 text-red-500">⚠</span>}
                                </motion.div>
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }} 
                                    animate={step >= 4 ? { x: 0, opacity: 1 } : {}} 
                                    transition={{ delay: 0.4 }} 
                                    className={`p-3 rounded text-xs font-mono truncate ${
                                        isPayloadCorrupted 
                                            ? 'bg-red-500/20 border-2 border-red-500/40 border-dashed text-red-400'
                                            : 'bg-jwt-payload/20 border border-jwt-payload/30 text-jwt-payload'
                                    }`}
                                >
                                    <span className="opacity-50 select-none mr-2">2.</span> {parts[1].substring(0,20)}...
                                    {isPayloadCorrupted && <span className="ml-2 text-red-500">⚠</span>}
                                </motion.div>
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={step >= 4 ? { x: 0, opacity: 1 } : {}} transition={{ delay: 0.6 }} className="bg-white/10 border border-white/20 p-3 rounded text-xs font-mono text-white flex justify-between items-center">
                                    <span><span className="opacity-50 select-none mr-2">3.</span> SECRET_KEY</span>
                                    <Lock size={12} className="opacity-50" />
                </motion.div>
                            </div>

                            <div className="flex justify-center">
                                <ArrowDown size={24} className={`animate-bounce ${(isHeaderCorrupted || isPayloadCorrupted) ? 'text-red-500' : 'text-claude-subtext'}`} />
                            </div>
                            
                            {/* The Function Box */}
                            <div className={`bg-black border rounded-xl p-4 text-center ${
                                (isHeaderCorrupted || isPayloadCorrupted || isSignatureInvalid)
                                    ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                    : 'border-jwt-signature shadow-[0_0_20px_rgba(95,176,176,0.2)]'
                            }`}>
                                <span className={`font-mono font-bold ${
                                    (isHeaderCorrupted || isPayloadCorrupted || isSignatureInvalid)
                                        ? 'text-red-400'
                                        : 'text-jwt-signature'
                                }`}>
                                    HMAC-SHA256( ... )
                                </span>
                                {(isHeaderCorrupted || isPayloadCorrupted || isSignatureInvalid) && (
                                    <div className="mt-2 text-xs text-red-400">⚠ Will Fail</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: THE RESULT COMPARISON */}
                        <div className="flex flex-col justify-center space-y-6 border-l border-white/10 pl-12">
                             <div className="text-xs text-claude-subtext font-serif">
                                 {(isSignatureMissing || isSignatureInvalid || isTokenTampered) ? (
                                     <>
                                         The server runs the math. However, the signature does not match the expected value, meaning the token is <span className="text-red-400 font-bold">Invalid</span>.
                                     </>
                                 ) : (
                                     <>
                                         The server runs the math. If the result matches the signature in the token perfectly, the token is <span className="text-white font-bold">Valid</span>.
                                     </>
                                 )}
                             </div>

                             <div className="space-y-4">
                                 <div>
                                     <div className="text-[10px] uppercase text-gray-500 mb-1">Calculated Hash</div>
                                     <div className="font-mono text-xs text-gray-400 bg-black/50 p-3 rounded border border-gray-700">
                                         {step >= 4 && parts[2] ? <ScrambleText text={parts[2].substring(0, 30)} delay={1.5} /> : '...'}...
                                     </div>
                                 </div>
                                 
                                 <div className={`flex justify-center ${(isSignatureMissing || isSignatureInvalid || isTokenTampered) ? 'text-red-500' : 'text-green-500'}`}>
                                     {(isSignatureMissing || isSignatureInvalid || isTokenTampered) ? (
                                         <motion.div
                                             animate={{ rotate: [0, -10, 10, 0] }}
                                             transition={{ duration: 0.5, repeat: Infinity }}
                                         >
                                             <ShieldCheck size={24} />
                                         </motion.div>
                                     ) : (
                                         <ShieldCheck size={24} />
                                     )}
                                 </div>

                                 <div>
                                     <div className="text-[10px] uppercase text-jwt-signature mb-1">Token Signature</div>
                                     <div className={`font-mono text-xs p-3 rounded border ${
                                         (isSignatureMissing || isSignatureInvalid || isTokenTampered)
                                             ? 'text-red-400 bg-red-500/10 border-red-500/30 border-dashed'
                                             : 'text-jwt-signature bg-jwt-signature/10 border-jwt-signature/30'
                                     }`}>
                                         {parts[2] ? parts[2].substring(0, 30) : 'Missing'}...
                                     </div>
                                 </div>
                             </div>

            {step >= 4 && !isSignatureMissing && !isSignatureInvalid && !isTokenTampered && (
               <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                                    transition={{ delay: 3 }}
                                    className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm font-bold border border-green-500/30 shadow-lg"
                                >
                                    Authenticity Verified
                                </motion.div>
                             )}
                        </div>

                    </div>
                </div>
                
                {/* Corruption Warnings for Signature */}
                {step >= 4 && isSignatureMissing && (
                    <CorruptionWarning partName="Signature" type="missing" />
                )}
                {step >= 4 && !isSignatureMissing && isSignatureInvalid && (
                    <CorruptionWarning partName="Signature" type="invalid" />
                )}
                {step >= 4 && !isSignatureMissing && !isSignatureInvalid && isTokenTampered && (
                    <CorruptionWarning partName="Token" type="tampered" />
                )}
            </div>

        </div>
        )}

        {/* ========================================================================= */}
        {/* ENCODE FLOW                                 */}
        {/* ========================================================================= */}
        {mode === 'encode' && (
            <div className="space-y-32 px-4">

                {/* E1: JSON PREPARATION */}
                <div ref={el => { stepRefs.current[1] = el; }} className={`transition-opacity duration-1000 ${step >= 1 ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-mono font-bold text-claude-subtext/20">01</div>
                        <h2 className="text-2xl font-serif text-claude-text">Input & Minification</h2>
                    </div>
                    <div className="bg-claude-surface border border-claude-border rounded-2xl p-8">
                        <p className="text-claude-subtext mb-8 font-serif">
                            We start with raw JSON objects. To prepare them for encoding, we remove all whitespace (minification).
                        </p>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <div className="text-xs uppercase text-jwt-header mb-2 font-bold">Header</div>
                                <pre className="bg-black/50 p-4 rounded text-xs text-gray-400 font-mono mb-2">{decodedHeader}</pre>
                                {step >= 1 && !isHeaderCorrupted && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-jwt-header/20 p-2 rounded text-xs text-jwt-header font-mono break-all border border-jwt-header/30">
                                        {JSON.stringify(JSON.parse(decodedHeader))}
                                    </motion.div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs uppercase text-jwt-payload mb-2 font-bold">Payload</div>
                                <pre className="bg-black/50 p-4 rounded text-xs text-gray-400 font-mono mb-2">{decodedPayload}</pre>
                                {step >= 1 && !isPayloadCorrupted && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="bg-jwt-payload/20 p-2 rounded text-xs text-jwt-payload font-mono break-all border border-jwt-payload/30">
                                        {JSON.stringify(JSON.parse(decodedPayload))}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        
                        {/* Warnings for corrupted data in encode mode */}
                        {step >= 1 && (isHeaderCorrupted || isPayloadCorrupted) && (
                            <div className="mt-6 space-y-4">
                                {isHeaderCorrupted && <CorruptionWarning partName="Header" type="tampered" />}
                                {isPayloadCorrupted && <CorruptionWarning partName="Payload" type="tampered" />}
                            </div>
                        )}
                    </div>
                        </div>

                {/* E2: BASE64 ENCODING */}
                <div ref={el => { stepRefs.current[2] = el; }} className={`transition-opacity duration-1000 ${step >= 2 ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-mono font-bold text-jwt-header/20">02</div>
                        <h2 className="text-2xl font-serif text-claude-text">Base64 Encoding</h2>
                    </div>
                    <div className="bg-claude-surface border border-claude-border rounded-2xl p-8">
                        <p className="text-claude-subtext mb-6 font-serif">
                            We convert the 8-bit ASCII bytes into 6-bit Base64 chunks. This ensures safe transport across URLs.
                        </p>
                        
                        {/* ENCODE MICROSCOPE */}
                        {step >= 2 && <Base64EncodeMicroscope />}

                        <div className="mt-8 grid md:grid-cols-2 gap-8">
                                <div>
                                <div className="text-[10px] uppercase text-gray-500 mb-1">Encoded Header</div>
                                <div className="font-mono text-sm text-jwt-header break-all">{parts[0]}</div>
                                </div>
                             <div>
                                <div className="text-[10px] uppercase text-gray-500 mb-1">Encoded Payload</div>
                                <div className="font-mono text-sm text-jwt-payload break-all">{parts[1]}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* E3: CONCATENATION */}
                <div ref={el => { stepRefs.current[3] = el; }} className={`transition-opacity duration-1000 ${step >= 3 ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-mono font-bold text-claude-subtext/20">03</div>
                        <h2 className="text-2xl font-serif text-claude-text">Assembly</h2>
                    </div>
                    <div className="bg-claude-surface border border-claude-border rounded-2xl p-8 flex items-center justify-center">
                        <div className="flex items-center gap-2 font-mono text-lg flex-wrap justify-center">
                             <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-jwt-header">{parts[0].substring(0,10)}...</motion.span>
                             <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="text-2xl text-white">.</motion.span>
                             <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-jwt-payload">{parts[1].substring(0,10)}...</motion.span>
                        </div>
                    </div>
                </div>

                {/* E4: SIGNING */}
                <div ref={el => { stepRefs.current[4] = el; }} className={`transition-opacity duration-1000 ${step >= 4 ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-mono font-bold text-jwt-signature/20">04</div>
                        <h2 className="text-2xl font-serif text-claude-text">Cryptographic Signing</h2>
                    </div>
                    <div className="bg-gradient-to-br from-claude-surface to-black border border-jwt-signature/30 rounded-2xl p-8 relative overflow-hidden">
                         <div className="relative z-10 flex flex-col items-center gap-6">
                             <div className="flex items-center gap-4 text-xs font-mono">
                                 <div className="bg-claude-bg p-2 rounded border border-claude-border">Input Data</div>
                                 <ArrowRight size={14} />
                                 <div className="bg-claude-accent p-2 rounded text-white font-bold">HMAC-SHA256</div>
                                 <ArrowRight size={14} />
                                 <div className="bg-jwt-signature/20 p-2 rounded text-jwt-signature border border-jwt-signature/30">Signature</div>
                             </div>
                             <div className="w-full bg-black p-4 rounded-xl border border-jwt-signature/20 font-mono text-xs text-jwt-signature break-all text-center">
                                 {step >= 4 ? <ScrambleText text={parts[2] || 'Missing'} delay={1} /> : ''}
                             </div>
                             {!isSignatureMissing && !isSignatureInvalid && !isTokenTampered && (
                                 <div className="text-green-500 text-sm flex items-center gap-2">
                                     <Lock size={14} /> Token is now secured
                                 </div>
                             )}
                         </div>
                    </div>
                    
                    {/* Signature Warnings */}
                    {step >= 4 && isSignatureMissing && (
                        <CorruptionWarning partName="Signature" type="missing" />
                    )}
                    {step >= 4 && !isSignatureMissing && isSignatureInvalid && (
                        <CorruptionWarning partName="Signature" type="invalid" />
                    )}
                    {step >= 4 && !isSignatureMissing && !isSignatureInvalid && isTokenTampered && (
                        <CorruptionWarning partName="Token" type="tampered" />
                    )}
                </div>

        </div>
        )}

    </div>
  );
}