/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { VoiceOverlay } from './components/VoiceOverlay';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Mode, ChatHistory, Message, UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './constants';
import { geminiService } from './services/geminiService';
import { Mic } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>('koma_prefs', DEFAULT_PREFERENCES);
  const [history, setHistory] = useLocalStorage<ChatHistory[]>('koma_history', []);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('pro');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentChat = history.find(c => c.id === currentChatId);

  const handleNewChat = useCallback(() => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      lastUpdated: Date.now(),
    };
    setHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, [setHistory]);

  useEffect(() => {
    if (history.length === 0) {
      handleNewChat();
    } else if (!currentChatId) {
      setCurrentChatId(history[0].id);
    }
  }, [history, currentChatId, handleNewChat]);

  const handleSendMessage = async (text: string, attachments: string[] = []) => {
    if (!currentChatId) return;

    const isImageGen = text.toLowerCase().startsWith('/image');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, userMessage];
        return {
          ...chat,
          messages: updatedMessages,
          title: chat.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : chat.title,
          lastUpdated: Date.now(),
        };
      }
      return chat;
    }));

    setIsLoading(true);

    try {
      let responseContent = '';
      let isImage = false;

      if (isImageGen) {
        const prompt = text.replace('/image', '').trim();
        responseContent = geminiService.generateImage(prompt || 'A beautiful futuristic city');
        isImage = true;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
      } else {
        const chatHistory = currentChat?.messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })) || [];

        const attachmentParts = attachments.map(a => ({
          data: a,
          mimeType: a.split(';')[0].split(':')[1]
        }));

        responseContent = await geminiService.generateResponse(
          text,
          mode,
          preferences,
          chatHistory,
          attachmentParts
        );
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseContent,
        timestamp: Date.now(),
        mode,
        isImage,
      };

      setHistory(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMessage],
            lastUpdated: Date.now(),
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error. Please check your connection or try again later.",
        timestamp: Date.now(),
      };
      setHistory(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...chat.messages, errorMessage] };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Wake Word Detection (Mock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        setIsVoiceOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <div className="fixed inset-0 glass-gradient pointer-events-none" />
      
      <Sidebar
        currentMode={mode}
        setMode={setMode}
        history={history}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-md bg-black/20 z-10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {mode} mode
            </span>
          </div>
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
          >
            <Mic size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Voice Chat</span>
          </button>
        </header>

        <ChatInterface
          messages={currentChat?.messages || []}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          mode={mode}
          preferences={preferences}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={setPreferences}
      />

      <VoiceOverlay
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        preferences={preferences}
      />
    </div>
  );
}
