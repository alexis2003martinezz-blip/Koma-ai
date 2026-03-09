import React from 'react';
import { MessageSquare, Settings, History, Plus, Brain, Zap, GraduationCap, Menu, X } from 'lucide-react';
import { Mode, ChatHistory } from '../types';
import { MODES } from '../constants';
import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';

interface SidebarProps {
  currentMode: Mode;
  setMode: (mode: Mode) => void;
  history: ChatHistory[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  setMode,
  history,
  currentChatId,
  onSelectChat,
  onNewChat,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const modeIcons = {
    think: Brain,
    pro: Zap,
    study: GraduationCap,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <GlassCard className="h-full rounded-none border-y-0 border-l-0 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Koma AI</h1>
          </div>

          <button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="w-full mb-8 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center gap-2 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-medium">New Chat</span>
          </button>

          <div className="space-y-2 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 px-2 mb-4">Modes</p>
            {MODES.map((mode) => {
              const Icon = modeIcons[mode.id];
              return (
                <button
                  key={mode.id}
                  onClick={() => setMode(mode.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    currentMode === mode.id
                      ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                      : "hover:bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 px-2 mb-4">History</p>
            {history.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left truncate",
                  currentChatId === chat.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white/60"
                )}
              >
                <MessageSquare size={18} className="shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </>
  );
};
