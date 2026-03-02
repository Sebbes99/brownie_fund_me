'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export function ChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: uuid(),
      role: 'user' as const,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.content }),
      });
      const data = await res.json();

      addChatMessage({
        id: uuid(),
        role: 'assistant',
        content: data.answer,
        createdAt: new Date().toISOString(),
      });
    } catch {
      addChatMessage({
        id: uuid(),
        role: 'assistant',
        content: 'Kunde inte generera svar. Försök igen.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="AI Assistent"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span className="font-semibold text-sm">AI Assistent</span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="p-1 rounded hover:bg-brand-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ställ frågor om dina anbud
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                'Vilka anbud stänger denna vecka?',
                'Sammanfatta anbud med match över 80%',
                'Vilka anbud finns i Göteborg?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-md hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg rounded-bl-none">
              <Loader2 size={16} className="animate-spin text-brand-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Fråga om dina anbud..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
