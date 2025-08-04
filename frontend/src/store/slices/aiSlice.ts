import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AIMessage, ChatContext } from '../../types/ai';
import { Contact } from '../../types/contact';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'analysis';
  title: string;
  description: string;
  confidence: number;
  data: any;
  createdAt: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  isActive: boolean;
}

export interface AIState {
  insights: AIInsight[];
  prompts: AIPrompt[];
  isGenerating: boolean;
  error: string | null;
  analyzingProfile: boolean;
  chatHistory: {
    id: string;
    message: string;
    response: string;
    timestamp: string;
  }[];
  chat: {
    messages: AIMessage[];
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: AIState = {
  insights: [],
  prompts: [],
  isGenerating: false,
  error: null,
  analyzingProfile: false,
  chatHistory: [],
  chat: {
    messages: [],
    isLoading: false,
    error: null,
  },
};

// Async thunk for generating AI response
export const generateAIResponse = createAsyncThunk(
  'ai/generateResponse',
  async (payload: {
    message: string;
    contact?: Contact;
    context?: ChatContext;
  }) => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }
    
    const data = await response.json();
    return data;
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setAnalyzingProfile: (state, action: PayloadAction<boolean>) => {
      state.analyzingProfile = action.payload;
    },
    setInsights: (state, action: PayloadAction<AIInsight[]>) => {
      state.insights = action.payload;
    },
    addInsight: (state, action: PayloadAction<AIInsight>) => {
      state.insights.unshift(action.payload);
    },
    removeInsight: (state, action: PayloadAction<string>) => {
      state.insights = state.insights.filter(insight => insight.id !== action.payload);
    },
    setPrompts: (state, action: PayloadAction<AIPrompt[]>) => {
      state.prompts = action.payload;
    },
    addPrompt: (state, action: PayloadAction<AIPrompt>) => {
      state.prompts.push(action.payload);
    },
    updatePrompt: (state, action: PayloadAction<AIPrompt>) => {
      const index = state.prompts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.prompts[index] = action.payload;
      }
    },
    deletePrompt: (state, action: PayloadAction<string>) => {
      state.prompts = state.prompts.filter(p => p.id !== action.payload);
    },
    addChatToHistory: (state, action: PayloadAction<{ message: string; response: string }>) => {
      state.chatHistory.push({
        id: Date.now().toString(),
        message: action.payload.message,
        response: action.payload.response,
        timestamp: new Date().toISOString(),
      });
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isGenerating = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Chat-related reducers
    addChatMessage: (state, action: PayloadAction<AIMessage>) => {
      state.chat.messages.push(action.payload);
    },
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.chat.isLoading = action.payload;
    },
    setChatError: (state, action: PayloadAction<string | null>) => {
      state.chat.error = action.payload;
    },
    clearChatMessages: (state) => {
      state.chat.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAIResponse.pending, (state) => {
        state.chat.isLoading = true;
        state.chat.error = null;
      })
      .addCase(generateAIResponse.fulfilled, (state, action) => {
        state.chat.isLoading = false;
        const aiMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: action.payload.message || action.payload.content,
          timestamp: new Date().toISOString(),
          metadata: action.payload.metadata,
        };
        state.chat.messages.push(aiMessage);
      })
      .addCase(generateAIResponse.rejected, (state, action) => {
        state.chat.isLoading = false;
        state.chat.error = action.error.message || 'Failed to generate response';
      });
  },
});

export const {
  setGenerating,
  setAnalyzingProfile,
  setInsights,
  addInsight,
  removeInsight,
  setPrompts,
  addPrompt,
  updatePrompt,
  deletePrompt,
  addChatToHistory,
  clearChatHistory,
  setError,
  clearError,
  addChatMessage,
  setChatLoading,
  setChatError,
  clearChatMessages,
} = aiSlice.actions;

export default aiSlice.reducer;