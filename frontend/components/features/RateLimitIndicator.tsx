'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface RateLimitInfo {
  requests_remaining: number;
  requests_limit: number;
  reset_time: string;
  global_requests_used?: number;
  global_requests_limit?: number;
}

export function RateLimitIndicator() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch immediately on mount
    fetchRateLimitInfo();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchRateLimitInfo, 30000);
    
    // Also check if reset time has passed and refresh immediately
    const checkResetInterval = setInterval(() => {
      if (rateLimitInfo) {
        const resetDate = new Date(rateLimitInfo.reset_time);
        const now = new Date();
        if (now > resetDate) {
          // Reset time has passed, fetch new info immediately
          fetchRateLimitInfo();
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(checkResetInterval);
    };
  }, [rateLimitInfo?.reset_time]);

  const fetchRateLimitInfo = async () => {
    try {
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jwt-visualiser.onrender.com';
      const response = await fetch(`${API_URL}/health`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.rate_limit_stats) {
        // Calculate remaining from stats
        const stats = data.rate_limit_stats;
        const remaining = stats.global_limit - stats.global_requests_today;
        
        setRateLimitInfo({
          requests_remaining: Math.max(0, remaining),
          requests_limit: stats.global_limit,
          reset_time: new Date(Date.now() + stats.reset_in_seconds * 1000).toISOString(),
          global_requests_used: stats.global_requests_today,
          global_requests_limit: stats.global_limit
        });
        setError(null);
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch rate limit info:', error);
      setError(error.message || 'Failed to connect');
      setIsLoading(false);
      
      // Set default placeholder data so component still renders
      if (!rateLimitInfo) {
        setRateLimitInfo({
          requests_remaining: 10,
          requests_limit: 10,
          reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          global_requests_used: 0,
          global_requests_limit: 45
        });
      }
    }
  };

  // Update rate limit when WebSocket messages are received (if on ask page)
  useEffect(() => {
    const handleRateLimit = (event: CustomEvent) => {
      if (event.detail) {
        setRateLimitInfo(event.detail);
      }
    };

    window.addEventListener('rate-limit-update' as any, handleRateLimit);
    return () => window.removeEventListener('rate-limit-update' as any, handleRateLimit);
  }, []);

  if (isLoading && !rateLimitInfo) {
    // Show loading state while fetching initial data
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-claude-surface border-2 border-claude-border shadow-lg backdrop-blur-sm"
        >
          {/* Pulsing loading indicator */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-claude-accent"
          />
          <span className="text-xs text-claude-subtext font-mono">Loading...</span>
          <Gauge size={14} className="text-claude-subtext" />
        </motion.div>
      </motion.div>
    );
  }

  if (!rateLimitInfo) {
    return null;
  }

  const percentage = (rateLimitInfo.requests_remaining / rateLimitInfo.requests_limit) * 100;
  const isLow = percentage < 30;
  const isCritical = percentage < 10;
  const isExhausted = rateLimitInfo.requests_remaining === 0;

  const getStatusColor = () => {
    if (isExhausted) return 'text-red-500';
    if (isCritical) return 'text-orange-500';
    if (isLow) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (isExhausted) return <AlertCircle size={14} className="text-red-500" />;
    if (isCritical || isLow) return <AlertCircle size={14} className="text-yellow-500" />;
    return <CheckCircle size={14} className="text-green-500" />;
  };

  const formatTimeUntilReset = () => {
    const resetDate = new Date(rateLimitInfo.reset_time);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();
    
    // If diff is negative, the reset time has passed - show "< 1m"
    if (diff < 0) {
      // Data is stale, will be refreshed by the interval
      return '< 1m';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Don't show negative time
    if (hours < 0 || minutes < 0) {
      return '< 1m';
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    // Show "< 1m" instead of "0m" for clarity
    if (minutes === 0) {
      return '< 1m';
    }
    
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 bg-claude-surface border border-claude-border rounded-xl shadow-2xl overflow-hidden mb-2"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-claude-accent/10 to-transparent px-4 py-3 border-b border-claude-border">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-claude-accent" />
                <h3 className="text-sm font-semibold text-claude-text">API Usage</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-claude-subtext">Requests Today</span>
                  <span className={`text-sm font-mono font-bold ${getStatusColor()}`}>
                    {rateLimitInfo.requests_remaining}/{rateLimitInfo.requests_limit}
                  </span>
                </div>
                
                <div className="relative w-full h-2 bg-claude-bg rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      isExhausted ? 'bg-red-500' :
                      isCritical ? 'bg-orange-500' :
                      isLow ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-claude-bg/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={12} className="text-claude-accent" />
                    <span className="text-[10px] uppercase tracking-wider text-claude-subtext font-bold">Available</span>
                  </div>
                  <div className={`text-xl font-bold ${getStatusColor()}`}>
                    {rateLimitInfo.requests_remaining}
                  </div>
                </div>

                <div className="bg-claude-bg/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-claude-accent" />
                    <span className="text-[10px] uppercase tracking-wider text-claude-subtext font-bold">Resets In</span>
                  </div>
                  <div className="text-xl font-bold text-claude-text">
                    {formatTimeUntilReset()}
                  </div>
                </div>
              </div>

              {/* Global Usage (if available) */}
              {rateLimitInfo.global_requests_used !== undefined && (
                <div className="pt-3 border-t border-claude-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-claude-subtext">Global Usage Today</span>
                    <span className="font-mono text-claude-text">
                      {rateLimitInfo.global_requests_used}/{rateLimitInfo.global_requests_limit}
                    </span>
                  </div>
                </div>
              )}

              {/* Connection Error Warning */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-orange-900/20 border border-orange-900/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-orange-200 font-medium mb-1">Connection Issue</p>
                      <p className="text-[10px] text-orange-300/70">
                        Cannot reach backend. Showing cached data.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Warning Message */}
              {isLow && !isExhausted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-200">
                      {isCritical 
                        ? 'Almost at limit! Use requests carefully.'
                        : 'Running low on requests. Consider waiting until reset.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Exhausted Message */}
              {isExhausted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-900/20 border border-red-900/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-200">
                      Daily limit reached. New requests available after reset.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Badge */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-full
          bg-claude-surface border-2 shadow-lg backdrop-blur-sm
          transition-all duration-200
          ${isExpanded ? 'border-claude-accent' : 'border-claude-border'}
          hover:border-claude-accent
        `}
      >
        {/* Status Indicator Dot */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`w-2 h-2 rounded-full ${
            isExhausted ? 'bg-red-500' :
            isCritical ? 'bg-orange-500' :
            isLow ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
        />

        {/* Count */}
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold font-mono ${getStatusColor()}`}>
            {rateLimitInfo.requests_remaining}
          </span>
          <span className="text-xs text-claude-subtext font-mono">
            /{rateLimitInfo.requests_limit}
          </span>
        </div>

        {/* Icon */}
        <Gauge size={14} className="text-claude-subtext" />
      </motion.button>

      {/* Tooltip on hover (when collapsed) */}
      {!isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-claude-surface border border-claude-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="text-xs text-claude-text font-medium">
              {rateLimitInfo.requests_remaining} requests remaining
            </p>
            <p className="text-[10px] text-claude-subtext">
              Click to view details
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

