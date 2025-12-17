'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ClaudeTextProps {
  text?: string;
  speed?: number; // ms per char
  onComplete?: () => void;
  onUpdate?: () => void; // Called during typing for scroll updates
}

export default function ClaudeText({ text = '', speed = 10, onComplete, onUpdate }: ClaudeTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayed('');
    setIsTyping(true);
    
    if (!text) {
      setIsTyping(false);
      return;
    }

    let index = 0;
    // We use a simple interval for the typewriter effect
    const timer = setInterval(() => {
      setDisplayed((prev) => text.slice(0, index + 1));
      index++;
      
      // Trigger update callback for auto-scroll
      if (onUpdate) onUpdate();
      
      if (index >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete, onUpdate]);

  return (
    <div className="leading-relaxed">
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-4 align-middle bg-claude-accent ml-1 animate-pulse" />
      )}
    </div>
  );
}