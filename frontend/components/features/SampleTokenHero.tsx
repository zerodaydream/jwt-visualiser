'use client';
import { motion } from 'framer-motion';
import { ArrowDown, Fingerprint, FileJson, ShieldCheck } from 'lucide-react';
import { useJwtStore } from '@/store/jwtStore';

// A real, valid sample token we can load
const SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function SampleTokenHero() {
  const { setToken } = useJwtStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-5xl mx-auto px-4">
      
      {/* 1. Visual Token Breakdown */}
      <div className="flex items-end gap-1 mb-6 select-none">
        {/* Header Segment */}
        <div className="flex flex-col items-center group cursor-pointer">
           <motion.span 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-4xl md:text-5xl font-mono font-bold tracking-tighter hover:opacity-80 transition-opacity"
           >
            <span className="text-jwt-header">{'{'}</span>
            <span className="text-jwt-header">eyJhbGci...</span>
            <span className="text-jwt-header">{'}'}</span>
            <span className="text-6xl md:text-7xl text-claude-subtext opacity-30">.</span>
           </motion.span>
           {/* Connecting Line */}
           <div className="h-12 w-px bg-gradient-to-b from-jwt-header to-transparent mt-4 opacity-50" />
        </div>

        {/* Payload Segment */}
        <div className="flex flex-col items-center group cursor-pointer">
           <motion.span 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="text-4xl md:text-5xl font-mono font-bold tracking-tighter hover:opacity-80 transition-opacity"
           >
            <span className="text-jwt-payload">{'{'}</span>
            <span className="text-jwt-payload">eyJzdWIi...</span>
            <span className="text-jwt-payload">{'}'}</span>
            <span className="text-6xl md:text-7xl text-claude-subtext opacity-30">.</span>
           </motion.span>
           <div className="h-12 w-px bg-gradient-to-b from-jwt-payload to-transparent mt-4 opacity-50" />
        </div>

        {/* Signature Segment */}
        <div className="flex flex-col items-center group cursor-pointer">
           <motion.span 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="text-4xl md:text-5xl font-mono font-bold tracking-tighter hover:opacity-80 transition-opacity"
           >
            <span className="text-jwt-signature">{'{'}</span>
            <span className="text-jwt-signature">SflKxwRJ...</span>
            <span className="text-jwt-signature">{'}'}</span>
           </motion.span>
           <div className="h-12 w-px bg-gradient-to-b from-jwt-signature to-transparent mt-4 opacity-50" />
        </div>
      </div>

      {/* 2. Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        
        {/* Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-claude-surface/50 border border-claude-border p-5 rounded-xl text-center relative overflow-hidden group hover:border-jwt-header/50 transition-colors"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-jwt-header opacity-50" />
            <div className="flex justify-center mb-3 text-jwt-header">
                <FileJson size={24} />
            </div>
            <h3 className="font-serif text-lg text-claude-text mb-2">The Header</h3>
            <p className="text-sm text-claude-subtext leading-relaxed">
                Defines the <span className="text-jwt-header">algorithm</span> (e.g., HS256) and token type. It tells the server how to read the rest.
            </p>
        </motion.div>

        {/* Payload Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-claude-surface/50 border border-claude-border p-5 rounded-xl text-center relative overflow-hidden group hover:border-jwt-payload/50 transition-colors"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-jwt-payload opacity-50" />
            <div className="flex justify-center mb-3 text-jwt-payload">
                <Fingerprint size={24} />
            </div>
            <h3 className="font-serif text-lg text-claude-text mb-2">The Payload</h3>
            <p className="text-sm text-claude-subtext leading-relaxed">
                Contains the <span className="text-jwt-payload">claims</span>. This is the data: user ID, expiration date, and roles. Visible, but tamper-proof.
            </p>
        </motion.div>

        {/* Signature Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-claude-surface/50 border border-claude-border p-5 rounded-xl text-center relative overflow-hidden group hover:border-jwt-signature/50 transition-colors"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-jwt-signature opacity-50" />
            <div className="flex justify-center mb-3 text-jwt-signature">
                <ShieldCheck size={24} />
            </div>
            <h3 className="font-serif text-lg text-claude-text mb-2">The Signature</h3>
            <p className="text-sm text-claude-subtext leading-relaxed">
                The <span className="text-jwt-signature">security seal</span>. Generated using a secret key. If even one character changes, this seal breaks.
            </p>
        </motion.div>
      </div>

      {/* 3. Call to Action */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <button
            onClick={() => setToken(SAMPLE_TOKEN)}
            className="group flex items-center gap-3 px-6 py-3 bg-claude-surface border border-claude-border rounded-full hover:bg-claude-input transition-all text-claude-text font-serif"
        >
            <span>Click to Analyze this Sample</span>
            <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
        </button>
      </motion.div>

    </div>
  );
}