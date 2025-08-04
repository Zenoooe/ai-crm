export interface Interaction {
  _id: string;
  contactId: string;
  userId: string;
  type: 'call' | 'wechat' | 'email' | 'meeting' | 'social';
  content: string;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  attachments: InteractionAttachment[];
  metadata: {
    duration?: number; // for calls/meetings in minutes
    location?: string; // for meetings
    platform?: string; // for social interactions
  };
  aiAnalysis: InteractionAIAnalysis;
  createdAt: string;
}

export interface InteractionAttachment {
  type: 'image' | 'document' | 'audio';
  url: string;
  filename: string;
  size?: number;
}

export interface InteractionAIAnalysis {
  keyInsights: string[];
  nextSteps: string[];
  salesStage: string;
  opportunityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

export interface CreateInteractionDto {
  contactId: string;
  type: Interaction['type'];
  content: string;
  topics?: string[];
  attachments?: File[];
  metadata?: Interaction['metadata'];
}

export interface InteractionsState {
  interactions: Interaction[];
  loading: boolean;
  error: string | null;
  selectedInteraction: Interaction | null;
}

export interface InteractionFilters {
  type?: Interaction['type'];
  dateRange?: {
    start: string;
    end: string;
  };
  sentiment?: Interaction['sentiment'];
}