export type Mode = 'think' | 'pro' | 'study';
export type Language = 'en' | 'es' | 'pt';

export interface UserPreferences {
  name: string;
  personality: string;
  language: Language;
  wakeWord: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: Mode;
  attachments?: string[]; // base64 or URLs
  isImage?: boolean;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}
