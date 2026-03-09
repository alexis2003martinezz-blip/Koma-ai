import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Loader2, User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, Mode, UserPreferences } from '../types';
import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, attachments?: string[]) => void;
  isLoading: boolean;
  mode: Mode;
  preferences: UserPreferences;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  mode,
  preferences,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
              <Sparkles size={40} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome, {preferences.name}</h2>
              <p className="text-white/60 max-w-md">
                I'm Koma AI, your intelligent companion. How can I assist you today in {mode} mode?
              </p>
              <p className="text-white/30 text-xs mt-4">
                Press <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Ctrl+M</kbd> for Voice Chat
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                msg.role === 'user' 
                  ? "bg-indigo-500 text-white" 
                  : "bg-white/10 text-white border border-white/10"
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              <div className={cn(
                "flex flex-col gap-2 max-w-[85%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <GlassCard className={cn(
                  "px-6 py-4",
                  msg.role === 'user' ? "bg-indigo-500/10 border-indigo-500/20" : ""
                )}>
                  {msg.isImage ? (
                    <img 
                      src={msg.content} 
                      alt="Generated" 
                      className="rounded-lg max-w-full h-auto shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <img 
                          key={i} 
                          src={att} 
                          alt="Attachment" 
                          className="w-20 h-20 object-cover rounded-lg border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}
                </GlassCard>
                <span className="text-[10px] uppercase tracking-widest text-white/30 px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.mode && ` • ${msg.mode}`}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 animate-pulse">
              <Bot size={20} className="text-white/40" />
            </div>
            <GlassCard className="px-6 py-4 flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={20} />
              <span className="text-white/60 text-sm font-medium">Koma is thinking...</span>
            </GlassCard>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 lg:p-8 bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          {attachments.length > 0 && (
            <div className="absolute bottom-full left-0 mb-4 flex flex-wrap gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  <img src={att} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Send size={12} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <GlassCard className="flex items-end gap-2 p-2 pl-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-white/40 hover:text-white transition-colors"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*,application/pdf,text/plain"
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Koma anything... (Use /image to generate)"
              className="flex-1 bg-transparent border-none focus:ring-0 text-white py-3 resize-none max-h-40 custom-scrollbar"
              rows={1}
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={cn(
                "p-3 rounded-xl transition-all",
                input.trim() || attachments.length > 0
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-white/20"
              )}
            >
              <Send size={20} />
            </button>
          </GlassCard>
        </form>
      </div>
    </div>
  );
};
