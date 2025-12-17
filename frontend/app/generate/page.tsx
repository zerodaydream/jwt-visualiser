'use client';
import { useState } from 'react';
import { useJwtStore } from '@/store/jwtStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, Check, AlertTriangle, ArrowRight, Settings2, Key, Clock, FileJson, Sparkles, Zap } from 'lucide-react';

const ALGOS = ['HS256', 'HS384', 'HS512'];

export default function GeneratePage() {
  const router = useRouter();
  const { setToken } = useJwtStore();

  // 1. ROBUST DEFAULTS (Works immediately on click)
  const [payload, setPayload] = useState(
`{
  "sub": "1234567890",
  "name": "John Doe",
  "role": "admin",
  "iat": 1516239022
}`
  );
  const [secret, setSecret] = useState('your-super-strong-256-bit-secret');
  const [algo, setAlgo] = useState('HS256');
  const [expiry, setExpiry] = useState(60); // minutes

  // UI State
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // JSON Validation
  const isJsonValid = (text: string) => {
    try {
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!isJsonValid(payload)) {
      setError("Invalid JSON format in Payload");
      return;
    }
    if (!secret) {
      setError("Secret key is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: JSON.parse(payload),
          secret,
          algorithm: algo,
          expires_in_minutes: Number(expiry)
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseToken = () => {
    setToken(generatedToken);
    router.push('/decode');
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4">
      
      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between">
        <div>
            <h1 className="text-3xl font-serif text-claude-text mb-2">Token Studio</h1>
            <p className="text-claude-subtext">Design, mint, and test production-ready JWTs.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mb-12">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="space-y-6">
          
          {/* Payload Editor */}
          <section className="bg-claude-surface border border-claude-border rounded-xl overflow-hidden flex flex-col h-[420px] shadow-sm hover:border-claude-subtext/30 transition-colors">
             <div className="bg-claude-bg/50 px-5 py-3 border-b border-claude-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-claude-text">
                   <FileJson size={16} className="text-jwt-payload" />
                   <span>Payload Claims</span>
                </div>
                {!isJsonValid(payload) ? (
                   <span className="text-xs text-red-400 flex items-center gap-1 bg-red-900/10 px-2 py-1 rounded">
                      <AlertTriangle size={12} /> Invalid JSON
                   </span>
                ) : (
                    <span className="text-xs text-green-400/50 flex items-center gap-1 font-mono">
                        Valid JSON
                    </span>
                )}
             </div>
             <div className="relative flex-1 group">
                <textarea 
                   value={payload}
                   onChange={(e) => setPayload(e.target.value)}
                   className="absolute inset-0 w-full h-full bg-claude-input p-5 font-mono text-sm text-claude-text resize-none focus:outline-none leading-relaxed"
                   spellCheck={false}
                />
             </div>
          </section>

          {/* Secret Key */}
          <section>
             <label className="flex items-center gap-2 text-sm font-medium text-claude-subtext mb-2 px-1">
                <Key size={16} /> Signing Secret
             </label>
             <div className="relative group">
                <input 
                  type="text" 
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full bg-claude-input border border-claude-border rounded-xl p-4 pr-12 text-sm text-claude-text focus:border-claude-accent focus:outline-none transition-all font-mono shadow-sm"
                  placeholder="Enter a strong secret..."
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
             </div>
          </section>

        </div>

        {/* RIGHT COLUMN: CONTROLS */}
        <div className="space-y-6">
           
           <div className="bg-claude-surface border border-claude-border rounded-xl p-6 space-y-8 shadow-sm h-full">
              <div className="flex items-center gap-2 text-claude-text font-serif pb-4 border-b border-claude-border">
                  <Settings2 size={18} /> Configuration
              </div>

              {/* Algorithm */}
              <div>
                 <label className="text-xs uppercase tracking-wider text-claude-subtext font-bold mb-3 block">Algorithm</label>
                 <div className="grid grid-cols-3 gap-2">
                    {ALGOS.map((a) => (
                       <button
                          key={a}
                          onClick={() => setAlgo(a)}
                          className={`py-3 px-1 rounded-lg text-xs font-mono transition-all border font-medium ${
                             algo === a 
                               ? 'bg-claude-accent text-white border-claude-accent shadow-lg shadow-claude-accent/20' 
                               : 'bg-claude-bg text-claude-subtext border-claude-border hover:border-claude-subtext hover:bg-claude-input'
                          }`}
                       >
                          {a}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Expiry */}
              <div>
                 <div className="flex justify-between text-xs mb-4">
                    <label className="uppercase tracking-wider text-claude-subtext font-bold">Expiration</label>
                    <span className="text-claude-accent font-mono bg-claude-accent/10 px-2 py-0.5 rounded border border-claude-accent/20">{expiry} min</span>
                 </div>
                 <input 
                    type="range" 
                    min="5" 
                    max="1440" 
                    step="5"
                    value={expiry}
                    onChange={(e) => setExpiry(Number(e.target.value))}
                    className="w-full h-1.5 bg-claude-bg rounded-lg appearance-none cursor-pointer accent-claude-accent"
                 />
                 <div className="flex justify-between text-[10px] text-claude-subtext mt-2 font-mono opacity-60">
                    <span>5m</span>
                    <span>24h</span>
                 </div>
              </div>

              {/* Generate Button */}
              <button
                 onClick={handleGenerate}
                 disabled={loading}
                 className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-auto shadow-xl"
              >
                 {loading ? (
                    <RefreshCw size={20} className="animate-spin" />
                 ) : (
                    <>
                        <Zap size={20} fill="currentColor" />
                        <span>Generate Token</span>
                    </>
                 )}
              </button>

              {error && (
                 <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-xs text-red-400 text-center"
                 >
                    {error}
                 </motion.div>
              )}
           </div>
        </div>
      </div>

      {/* FULL WIDTH RESULT SECTION */}
      <AnimatePresence>
        {generatedToken && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
             <div className="flex items-center gap-3 mb-4 px-2">
                 <div className="p-2 bg-claude-accent/10 rounded-lg">
                    <Sparkles size={18} className="text-claude-accent" />
                 </div>
                 <h2 className="text-xl font-serif text-claude-text">Generated Result</h2>
             </div>

             <div className="relative bg-gradient-to-br from-claude-surface to-black border border-claude-border rounded-2xl overflow-hidden shadow-2xl group">
                
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jwt-header via-jwt-payload to-jwt-signature opacity-50" />

                <div className="p-8">
                    {/* The Token Display */}
                    <div className="font-mono text-base md:text-lg text-claude-subtext break-all leading-relaxed bg-black/50 p-6 rounded-xl border border-claude-border/50 hover:border-claude-accent/30 transition-colors selection:bg-claude-accent selection:text-white">
                        {generatedToken}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mt-8">
                         <button 
                             onClick={handleCopy}
                             className="flex-1 py-3 px-6 bg-claude-input hover:bg-claude-surface border border-claude-border rounded-xl text-claude-text font-medium transition-all flex items-center justify-center gap-2 group/btn"
                         >
                             {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="group-hover/btn:scale-110 transition-transform" />}
                             <span>{copied ? 'Copied to Clipboard' : 'Copy Token'}</span>
                         </button>

                         <button 
                             onClick={handleUseToken}
                             className="flex-[2] py-3 px-6 bg-claude-accent hover:bg-claude-accent/90 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-claude-accent/20 hover:shadow-claude-accent/40"
                         >
                             <span>Analyze & Decode</span>
                             <ArrowRight size={18} />
                         </button>
                    </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}