import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Interaction {
  _id: string;
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  content: string;
  date: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteractionsState {
  interactions: Interaction[];
  selectedInteraction: Interaction | null;
  loading: boolean;
  error: string | null;
  filters: {
    contactId?: string;
    type?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

const initialState: InteractionsState = {
  interactions: [],
  selectedInteraction: null,
  loading: false,
  error: null,
  filters: {},
};

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInteractions: (state, action: PayloadAction<Interaction[]>) => {
      state.interactions = action.payload;
      state.loading = false;
      state.error = null;
    },
    addInteraction: (state, action: PayloadAction<Interaction>) => {
      state.interactions.unshift(action.payload);
    },
    updateInteraction: (state, action: PayloadAction<Interaction>) => {
      const index = state.interactions.findIndex(i => i._id === action.payload._id);
      if (index !== -1) {
        state.interactions[index] = action.payload;
      }
      if (state.selectedInteraction?._id === action.payload._id) {
        state.selectedInteraction = action.payload;
      }
    },
    deleteInteraction: (state, action: PayloadAction<string>) => {
      state.interactions = state.interactions.filter(i => i._id !== action.payload);
      if (state.selectedInteraction?._id === action.payload) {
        state.selectedInteraction = null;
      }
    },
    setSelectedInteraction: (state, action: PayloadAction<Interaction | null>) => {
      state.selectedInteraction = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<InteractionsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setInteractions,
  addInteraction,
  updateInteraction,
  deleteInteraction,
  setSelectedInteraction,
  setFilters,
  setError,
  clearError,
} = interactionsSlice.actions;

export default interactionsSlice.reducer;