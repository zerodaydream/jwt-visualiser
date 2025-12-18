'use client';
import { useEffect, useState } from 'react';
import { useJwtStore } from '@/store/jwtStore';
import { motion } from 'framer-motion';
import ClaudeText from '@/components/features/ClaudeText';
import SampleTokenHero from '@/components/features/SampleTokenHero'; // Make sure this path matches where you saved it
import { ShieldAlert } from 'lucide-react';

export default function DecodePage() {
  const { rawToken, isValidStructure } = useJwtStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Logic
  useEffect(() => {
    // Only fetch if we have a structurally valid token (3 parts)
    if (!rawToken || !isValidStructure) {
        setData(null);
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/v1/decode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: rawToken })
        });
        
        if (!res.ok) throw new Error('Backend error');
        
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Invalid Token');
        
        setData(json);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Minimal debounce to avoid rapid-fire requests
    const timer = setTimeout(fetchData, 50);
    return () => clearTimeout(timer);
  }, [rawToken, isValidStructure]);

  // --- NEW: Empty State / Hero Section ---
  if (!rawToken) {
    return <SampleTokenHero />;
  }
  // ---------------------------------------

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      
      {/* Loading Skeleton */}
      {loading && (
          <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-claude-surface rounded w-1/3"></div>
              <div className="h-32 bg-claude-surface rounded border border-claude-border"></div>
          </div>
      )}

      {/* Error State */}
      {!loading && error && (
          <div className="p-4 rounded-lg bg-red-900/10 border border-red-900/30 text-red-400 flex items-center gap-3">
              <ShieldAlert size={20} />
              <span>{error}</span>
          </div>
      )}

      {/* Valid Data Display */}
      {!loading && data && (
        <>
            {/* 1. Header Section */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-jwt-header border border-jwt-header px-2 py-0.5 rounded-full">HEADER</span>
                    <h2 className="text-claude-text font-serif text-lg">Algorithm & Type</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* JSON View */}
                    <div className="bg-claude-surface p-4 rounded-lg border border-claude-border font-mono text-sm text-claude-subtext overflow-x-auto">
                        <pre>{JSON.stringify(data.header, null, 2)}</pre>
                    </div>
                    {/* Explanation */}
                    <div className="bg-claude-surface/50 p-4 rounded-lg border border-claude-border/50">
                        <ClaudeText text={data.analysis.header_explanation} speed={15} />
                    </div>
                </div>
            </section>

            {/* 2. Payload Section */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-jwt-payload border border-jwt-payload px-2 py-0.5 rounded-full">PAYLOAD</span>
                    <h2 className="text-claude-text font-serif text-lg">Data & Claims</h2>
                </div>

                <div className="bg-claude-surface p-5 rounded-lg border border-claude-border mb-4 font-mono text-sm text-claude-subtext overflow-x-auto">
                     <pre>{JSON.stringify(data.payload, null, 2)}</pre>
                </div>

                <div className="space-y-3">
                    {data.analysis.claims_explanation.map((claim: any, i: number) => (
                        <motion.div 
                            key={claim.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4 p-3 rounded-md hover:bg-claude-surface transition-colors border-l-2 border-transparent hover:border-jwt-payload"
                        >
                            <div className="w-24 shrink-0 font-mono text-sm text-claude-text text-right">{claim.key}</div>
                            <div className="text-sm font-serif text-claude-subtext">
                                <span className="text-claude-accent">{String(claim.value)}</span>
                                <p className="mt-1 opacity-70">{claim.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. Signature (Static/Simple) */}
            <section className="opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-jwt-signature border border-jwt-signature px-2 py-0.5 rounded-full">SIGNATURE</span>
                </div>
                <div className="bg-claude-surface p-4 rounded-lg border border-claude-border font-mono text-xs break-all text-claude-subtext">
                    {data.signature || "No Signature"}
                </div>
            </section>
        </>
      )}
    </div>
  );
}