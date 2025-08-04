import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'prospect';
  source: string;
  assignedTo?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    tags?: string[];
    assignedTo?: string;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: ContactsState = {
  contacts: [],
  selectedContact: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload;
      state.loading = false;
      state.error = null;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.unshift(action.payload);
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.contacts.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.contacts[index] = action.payload;
      }
      if (state.selectedContact?._id === action.payload._id) {
        state.selectedContact = action.payload;
      }
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(c => c._id !== action.payload);
      if (state.selectedContact?._id === action.payload) {
        state.selectedContact = null;
      }
    },
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ContactsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<ContactsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
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
  setContacts,
  addContact,
  updateContact,
  deleteContact,
  setSelectedContact,
  setFilters,
  setPagination,
  setError,
  clearError,
} = contactsSlice.actions;

export default contactsSlice.reducer;