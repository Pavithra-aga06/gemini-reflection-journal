export type AIMode = 'reflect' | 'summarize' | 'brainstorm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  formattedAddress?: string;
  city?: string;
  country?: string;
  attachedAt: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  mode: AIMode;
  messages: ChatMessage[];
  location?: JournalLocation;
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
