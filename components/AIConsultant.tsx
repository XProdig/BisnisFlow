import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateBusinessAdvice } from '../services/geminiService';

interface AIConsultantProps {
  businessContext: string;
}

export const AIConsultant: React.FC<AIConsultantProps> = ({ businessContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo! Saya asisten bisnis pintar Anda. Ada yang bisa saya bantu terkait analisis penjualan, strategi harga, atau manajemen stok hari ini?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateBusinessAdvice(userMsg.text, businessContext);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-100 bg-emerald-50 rounded-t-lg flex items-center gap-2">
        <Bot className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="font-semibold text-emerald-900">Konsultan Bisnis AI</h2>
          <p className="text-xs text-emerald-600">Didukung oleh Gemini 3</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-emerald-600" />}
            </div>
            <div
              className={`flex flex-col w-full max-w-[80%] leading-1.5 p-4 border-gray-200 rounded-e-xl rounded-es-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-s-xl rounded-se-none' 
                  : 'bg-gray-100 text-gray-800 rounded-ss-none'
              }`}
            >
              <div className="text-sm font-normal markdown-body whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm ml-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sedang berpikir...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
            placeholder="Tanya tentang performa bisnismu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-emerald-300 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
