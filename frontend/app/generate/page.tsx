'use client';
import { useState, useRef } from 'react';
import { useJwtStore } from '@/store/jwtStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, Check, AlertTriangle, ArrowRight, Settings2, Key, Clock, FileJson, Sparkles, Zap, List, Code } from 'lucide-react';
import { apiRequest } from '@/utils/api';

const ALGOS = [
  { value: 'none', label: 'none', description: 'No signature (unsafe)' },
  { value: 'HS256', label: 'HS256', description: 'HMAC using SHA-256' },
  { value: 'HS384', label: 'HS384', description: 'HMAC using SHA-384' },
  { value: 'HS512', label: 'HS512', description: 'HMAC using SHA-512' },
  { value: 'RS256', label: 'RS256', description: 'RSA using SHA-256' },
  { value: 'RS384', label: 'RS384', description: 'RSA using SHA-384' },
  { value: 'RS512', label: 'RS512', description: 'RSA using SHA-512' },
  { value: 'ES256', label: 'ES256', description: 'ECDSA using P-256 and SHA-256' },
  { value: 'ES384', label: 'ES384', description: 'ECDSA using P-384 and SHA-384' },
  { value: 'ES512', label: 'ES512', description: 'ECDSA using P-521 and SHA-512' },
  { value: 'PS256', label: 'PS256', description: 'RSASSA-PSS using SHA-256' },
  { value: 'PS384', label: 'PS384', description: 'RSASSA-PSS using SHA-384' },
  { value: 'PS512', label: 'PS512', description: 'RSASSA-PSS using SHA-512' },
  { value: 'EdDSA', label: 'EdDSA (Ed25519)', description: 'EdDSA using Ed25519' },
];

const ENCODING_FORMATS = [
  { value: 'base64', label: 'Base64URL' },
  { value: 'utf8', label: 'UTF-8' },
];

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
  const [secret, setSecret] = useState('');
  const [algo, setAlgo] = useState('HS256');
  const [expiry, setExpiry] = useState(60); // minutes
  const [encodingFormat, setEncodingFormat] = useState('base64');
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');

  // UI State
  const [generatedToken, setGeneratedToken] = useState('');
  const [decodedHeader, setDecodedHeader] = useState<any>(null);
  const [decodedPayload, setDecodedPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Ref for auto-scroll
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Format expiry display
  const formatExpiry = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

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

    setLoading(true);
    setError(null);

    try {
      // Use AUTO_GENERATE_KEY for empty secrets - backend will handle key generation
      const secretToUse = secret.trim() || 'AUTO_GENERATE_KEY';

      const data = await apiRequest<any>('/api/v1/generate', {
        method: 'POST',
        body: JSON.stringify({
          payload: JSON.parse(payload),
          secret: secretToUse,
          algorithm: algo,
          expires_in_minutes: Number(expiry)
        })
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedToken(data.token);
      
      // Decode the generated token to show header and payload
      const parts = data.token.split('.');
      if (parts.length === 3) {
        try {
          const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          const payloadDecoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          setDecodedHeader(header);
          setDecodedPayload(payloadDecoded);
        } catch (e) {
          console.error('Failed to decode token parts:', e);
        }
      }
      
      // Auto-scroll to result section
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
                  placeholder="Leave empty to auto-generate secure keys..."
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
             </div>
             <div className="mt-2 px-1 text-[10px] text-claude-subtext/70">
                Cryptographic keys are automatically generated for all selected algorithms
             </div>
          </section>

        </div>

        {/* RIGHT COLUMN: CONTROLS */}
        <div className="space-y-6">
           
           <div className="bg-claude-surface border border-claude-border rounded-xl p-6 space-y-8 shadow-sm h-full">
              <div className="flex items-center gap-2 text-claude-text font-serif pb-4 border-b border-claude-border">
                  <Settings2 size={18} /> Configuration
              </div>

              {/* Algorithm Selection - Grid Style */}
              <div>
                 <label className="text-xs uppercase tracking-wider text-claude-subtext font-bold mb-3 block">Signing Algorithm</label>
                 <div className="relative max-h-[240px] overflow-y-auto scrollbar-thin pr-1">
                    <div className="grid grid-cols-2 gap-2">
                       {ALGOS.map((a) => (
                          <button
                             key={a.value}
                             onClick={() => setAlgo(a.value)}
                             className={`py-2.5 px-3 rounded-lg text-xs font-mono transition-all border font-medium text-left ${
                                algo === a.value 
                                  ? 'bg-claude-accent text-white border-claude-accent shadow-lg shadow-claude-accent/20' 
                                  : 'bg-claude-bg text-claude-subtext border-claude-border hover:border-claude-subtext hover:bg-claude-input'
                             }`}
                          >
                             {a.label}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="mt-2 text-[10px] text-claude-subtext/70 px-1">
                    All algorithms supported with auto-generated keys
                 </div>
              </div>

              {/* Encoding Format - Toggle Style */}
              <div>
                 <label className="text-xs uppercase tracking-wider text-claude-subtext font-bold mb-3 block">Encoding Format</label>
                 <div className="flex gap-2">
                    {ENCODING_FORMATS.map((fmt) => (
                       <button
                          key={fmt.value}
                          onClick={() => setEncodingFormat(fmt.value)}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all border ${
                             encodingFormat === fmt.value 
                               ? 'bg-claude-accent text-white border-claude-accent shadow-lg shadow-claude-accent/20' 
                               : 'bg-claude-bg text-claude-subtext border-claude-border hover:border-claude-subtext hover:bg-claude-input'
                          }`}
                       >
                          {fmt.label}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Expiry */}
              <div>
                 <div className="flex justify-between text-xs mb-4">
                    <label className="uppercase tracking-wider text-claude-subtext font-bold">Expiration</label>
                    <span className="text-claude-accent font-mono bg-claude-accent/10 px-2 py-0.5 rounded border border-claude-accent/20">{formatExpiry(expiry)}</span>
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
        {generatedToken && decodedHeader && decodedPayload && (
          <motion.div 
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
             <div className="flex items-center gap-3 mb-4 px-2">
                 <div className="p-2 bg-claude-accent/10 rounded-lg">
                    <Sparkles size={18} className="text-claude-accent" />
                 </div>
                 <h2 className="text-xl font-serif text-claude-text">Generated Token</h2>
             </div>

             {/* Token Display */}
             <div className="relative bg-gradient-to-br from-claude-surface to-black border border-claude-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jwt-header via-jwt-payload to-jwt-signature opacity-50" />
                <div className="p-6">
                    <div className="font-mono text-sm md:text-base text-claude-subtext break-all leading-relaxed bg-black/50 p-5 rounded-xl border border-claude-border/50 mb-6">
                        {generatedToken}
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                         <button 
                             onClick={handleCopy}
                             className="flex-1 py-2.5 px-5 bg-claude-input hover:bg-claude-surface border border-claude-border rounded-lg text-claude-text font-medium transition-all flex items-center justify-center gap-2 group/btn text-sm"
                         >
                             {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />}
                             <span>{copied ? 'Copied!' : 'Copy Token'}</span>
                         </button>

                         <button 
                             onClick={handleUseToken}
                             className="flex-[2] py-2.5 px-5 bg-claude-accent hover:bg-claude-accent/90 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-claude-accent/20 text-sm"
                         >
                             <span>Analyze & Decode</span>
                             <ArrowRight size={16} />
                         </button>
                    </div>
                </div>
             </div>

             {/* Decoded Header Section */}
             <div className="bg-claude-surface border border-claude-border rounded-xl overflow-hidden">
                <div className="bg-claude-bg/50 px-5 py-3 border-b border-claude-border flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-jwt-header border border-jwt-header/50 px-2 py-0.5 rounded-full">HEADER</span>
                      <h3 className="text-sm font-medium text-claude-text">Algorithm & Type</h3>
                   </div>
                </div>
                <div className="p-5">
                   <pre className="font-mono text-xs text-claude-subtext overflow-x-auto">{JSON.stringify(decodedHeader, null, 2)}</pre>
                </div>
             </div>

             {/* Decoded Payload Section with Tabs */}
             <div className="bg-claude-surface border border-claude-border rounded-xl overflow-hidden">
                <div className="bg-claude-bg/50 px-5 py-3 border-b border-claude-border flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-jwt-payload border border-jwt-payload/50 px-2 py-0.5 rounded-full">PAYLOAD</span>
                      <h3 className="text-sm font-medium text-claude-text">Claims & Data</h3>
                   </div>
                   
                   {/* View Toggle */}
                   <div className="flex gap-1 bg-claude-bg border border-claude-border rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('json')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                          viewMode === 'json'
                            ? 'bg-claude-accent text-white'
                            : 'text-claude-subtext hover:text-claude-text'
                        }`}
                      >
                        <Code size={12} />
                        JSON
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                          viewMode === 'table'
                            ? 'bg-claude-accent text-white'
                            : 'text-claude-subtext hover:text-claude-text'
                        }`}
                      >
                        <List size={12} />
                        CLAIMS TABLE
                      </button>
                   </div>
                </div>
                
                <div className="p-5">
                   {viewMode === 'json' ? (
                      <pre className="font-mono text-xs text-claude-subtext overflow-x-auto">{JSON.stringify(decodedPayload, null, 2)}</pre>
                   ) : (
                      <div className="space-y-1">
                         {Object.entries(decodedPayload).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-[120px_1fr] gap-4 py-2.5 px-3 hover:bg-claude-bg/50 rounded transition-colors border-l-2 border-transparent hover:border-jwt-payload">
                               <div className="font-mono text-xs text-claude-text font-medium">{key}</div>
                               <div className="font-mono text-xs text-claude-accent break-all">{JSON.stringify(value)}</div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}