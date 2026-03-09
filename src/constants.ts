import { Mode, Language } from './types';

export const MODES: { id: Mode; label: string; description: string }[] = [
  {
    id: 'think',
    label: 'Think Mode',
    description: 'Deep analytical reasoning for complex problems.',
  },
  {
    id: 'pro',
    label: 'Pro Mode',
    description: 'Advanced, high-level technical responses.',
  },
  {
    id: 'study',
    label: 'Study Mode',
    description: 'Educational explanations with summaries.',
  },
];

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
];

export const DEFAULT_PREFERENCES = {
  name: 'User',
  personality: 'Helpful and friendly AI assistant',
  language: 'en' as Language,
  wakeWord: 'Koma',
};
