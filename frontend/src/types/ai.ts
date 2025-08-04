export interface SalesScript {
  _id: string;
  userId: string;
  category: 'opening' | 'discovery' | 'presentation' | 'objection' | 'closing';
  scenario: string;
  methodology: 'straight-line' | 'sandler' | 'challenger' | 'custom';
  script: {
    title: string;
    content: string;
    variables: string[]; // placeholders for personalization
    effectiveness: number;
  };
  usage: {
    timesUsed: number;
    successRate: number;
    lastUsed?: string;
  };
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  _id: string;
  userId: string;
  contactId: string;
  analysisType: 'profile' | 'opportunity' | 'script-generation';
  input: Record<string, any>;
  output: {
    personality?: {
      type: string;
      traits: string[];
      communicationStyle: string;
    };
    businessProfile?: {
      decisionAuthority: 'high' | 'medium' | 'low';
      influenceLevel: 'high' | 'medium' | 'low';
      budgetAuthority: 'high' | 'medium' | 'low';
      painPoints: string[];
      priorities: string[];
    };
    relationshipInsights?: {
      rapportLevel: number;
      trustIndicators: string[];
      engagementLevel: 'high' | 'medium' | 'low';
      preferredTopics: string[];
    };
    salesStrategy?: {
      currentStage: 'awareness' | 'interest' | 'consideration' | 'decision';
      nextBestActions: string[];
      timingRecommendations: string;
      approachStrategy: string;
    };
    opportunityAssessment?: {
      score: number;
      likelihood: 'high' | 'medium' | 'low';
      timeline: string;
      potentialValue: string;
    };
  };
  confidence: number;
  model: string;
  tokens: number;
  processingTime: number;
  createdAt: string;
}

export interface GenerateScriptRequest {
  contactId: string;
  scenario: string;
  methodology: SalesScript['methodology'];
  objective: string;
  currentSituation?: string;
}

export interface GenerateScriptResponse {
  opening: string;
  talkingPoints: string[];
  questions: string[];
  objectionHandling: Record<string, string>;
  closing: string;
  personalizationNotes: string[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'script' | 'analysis' | 'recommendation';
    confidence?: number;
    methodology?: string;
    contactId?: string;
  };
}

export interface ChatContext {
  contactId?: string;
  scenario?: string;
  methodology?: string;
  currentStage?: string;
  objective?: string;
}

export interface AIState {
  analyses: AIAnalysis[];
  scripts: SalesScript[];
  loading: boolean;
  error: string | null;
  generatingScript: boolean;
  analyzingProfile: boolean;
  chat: {
    messages: AIMessage[];
    isLoading: boolean;
    error: string | null;
  };
}

export interface SalesMethodology {
  name: string;
  stages: {
    name: string;
    description: string;
    objectives: string[];
    duration?: string;
  }[];
}

export const SALES_METHODOLOGIES: Record<string, SalesMethodology> = {
  'straight-line': {
    name: 'Straight-Line Sales',
    stages: [
      {
        name: 'Rapport Building',
        description: 'Establish trust and connection',
        objectives: ['Build trust', 'Create connection', 'Get permission to continue']
      },
      {
        name: 'Needs Discovery',
        description: 'Identify pain points and needs',
        objectives: ['Identify pain points', 'Understand current situation', 'Qualify opportunity']
      },
      {
        name: 'Solution Presentation',
        description: 'Present tailored solution',
        objectives: ['Present solution', 'Demonstrate value', 'Address specific needs']
      },
      {
        name: 'Objection Handling',
        description: 'Address concerns and objections',
        objectives: ['Address concerns', 'Provide reassurance', 'Maintain momentum']
      },
      {
        name: 'Closing',
        description: 'Secure commitment',
        objectives: ['Secure commitment', 'Move to next step', 'Schedule follow-up']
      }
    ]
  },
  'sandler': {
    name: 'Sandler 7-Step Process',
    stages: [
      {
        name: 'Bonding & Rapport',
        description: 'Build trust and establish comfort',
        objectives: ['Build trust', 'Establish comfort', 'Create connection'],
        duration: '5-10 minutes'
      },
      {
        name: 'Up-Front Contracts',
        description: 'Set expectations and define process',
        objectives: ['Set expectations', 'Define process', 'Get agreement'],
        duration: '2-5 minutes'
      },
      {
        name: 'Pain Discovery',
        description: 'Identify problems and quantify impact',
        objectives: ['Identify problems', 'Quantify impact', 'Emotional connection'],
        duration: '15-20 minutes'
      },
      {
        name: 'Budget Discussion',
        description: 'Understand investment capacity',
        objectives: ['Understand investment capacity', 'Qualify financially'],
        duration: '5-10 minutes'
      },
      {
        name: 'Decision Process',
        description: 'Identify decision makers and process',
        objectives: ['Identify decision makers', 'Understand process', 'Timeline'],
        duration: '5-10 minutes'
      },
      {
        name: 'Fulfillment',
        description: 'Present solution matched to pain',
        objectives: ['Present solution', 'Match to pain', 'Demonstrate value'],
        duration: '10-15 minutes'
      },
      {
        name: 'Post-Sell',
        description: 'Confirm decision and next steps',
        objectives: ['Confirm decision', 'Next steps', 'Implementation'],
        duration: '5-10 minutes'
      }
    ]
  }
};