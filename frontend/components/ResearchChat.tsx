'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../lib/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResearchChatProps {
  sessionId: string;
}

export default function ResearchChat({ sessionId }: ResearchChatProps) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !token) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch(`http://localhost:3001/api/research/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader found');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        accumulated += text;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = accumulated;
          return newMessages;
        });
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = 'Sorry, experimental chat failed. Please try again.';
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm flex flex-col h-125 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <h2 className="font-bold text-zinc-800 text-xs uppercase tracking-widest">Interactive Intelligence Chat</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
            <Sparkles className="w-8 h-8 text-zinc-300" />
            <p className="text-xs font-medium text-zinc-500 max-w-45">Ask follow-up questions about the data in this report.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-zinc-100' : 'bg-blue-600'}`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-zinc-500" /> : <Sparkles className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-zinc-100 text-zinc-800 rounded-tr-none' : 'bg-white border border-zinc-100 shadow-xs text-zinc-700 rounded-tl-none'}`}>
                <div className="prose prose-sm prose-zinc max-w-none prose-p:leading-relaxed">
                  <ReactMarkdown>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="flex gap-3">
               <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
               </div>
               <div className="p-3 bg-zinc-50 rounded-2xl flex gap-1">
                  <div className="w-1 h-1 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
               </div>
             </div>
           </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-zinc-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            placeholder="Ask a follow-up..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-30 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
