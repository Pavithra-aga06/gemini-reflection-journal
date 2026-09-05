export type AIMode = 'reflect' | 'summarize' | 'brainstorm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  mode: AIMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
