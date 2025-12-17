import { create } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ChatState {
  messages: ChatMessage[];
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setMessages: (messages) => set({ messages }),
  
  clearMessages: () => set({ messages: [] }),
}));

