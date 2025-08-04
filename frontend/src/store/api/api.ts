import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Contact', 'Interaction', 'User', 'Task'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<
      { user: any; token: string; refreshToken: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    register: builder.mutation<
      { user: any; token: string; refreshToken: string },
      { email: string; password: string; firstName: string; lastName: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Contact endpoints
    getContacts: builder.query<any[], void>({
      query: () => '/contacts',
      providesTags: ['Contact'],
    }),
    
    getContact: builder.query<any, string>({
      query: (id) => `/contacts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contact', id }],
    }),
    
    createContact: builder.mutation<any, Partial<any>>({
      query: (contact) => ({
        url: '/contacts',
        method: 'POST',
        body: contact,
      }),
      invalidatesTags: ['Contact'],
    }),
    
    updateContact: builder.mutation<any, { id: string; data: Partial<any> }>({
      query: ({ id, data }) => ({
        url: `/contacts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Contact', id }],
    }),
    
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Contact'],
    }),
    
    // Interaction endpoints
    getInteractions: builder.query<any[], { contactId?: string }>({
      query: ({ contactId }) => ({
        url: '/interactions',
        params: contactId ? { contactId } : {},
      }),
      providesTags: ['Interaction'],
    }),
    
    createInteraction: builder.mutation<any, Partial<any>>({
      query: (interaction) => ({
        url: '/interactions',
        method: 'POST',
        body: interaction,
      }),
      invalidatesTags: ['Interaction'],
    }),
    
    // Task endpoints
    getTasks: builder.query<any[], void>({
      query: () => '/tasks',
      providesTags: ['Task'],
    }),
    
    createTask: builder.mutation<any, Partial<any>>({
      query: (task) => ({
        url: '/tasks',
        method: 'POST',
        body: task,
      }),
      invalidatesTags: ['Task'],
    }),

    // AI endpoints
    generateAIResponse: builder.mutation<
      { message: string; metadata?: any; timestamp: string },
      { message: string; contact?: any; context?: any }
    >({
      query: (payload) => ({
        url: '/ai/chat',
        method: 'POST',
        body: payload,
      }),
    }),

    analyzeProfile: builder.mutation<
      any,
      { contactId: string; interactions?: any[] }
    >({
      query: (payload) => ({
        url: '/ai/analyze-profile',
        method: 'POST',
        body: payload,
      }),
    }),

    getAnalysis: builder.query<any, string>({
      query: (contactId) => `/ai/analysis/${contactId}`,
    }),

    generateScript: builder.mutation<
      any,
      { contactId: string; methodology: string; category: string; scenario: string }
    >({
      query: (payload) => ({
        url: '/ai/generate-script',
        method: 'POST',
        body: payload,
      }),
    }),

    getScripts: builder.query<any[], string>({
      query: (contactId) => `/ai/scripts/${contactId}`,
    }),

    saveScript: builder.mutation<any, any>({
      query: (scriptData) => ({
        url: '/ai/scripts',
        method: 'POST',
        body: scriptData,
      }),
    }),

    updateScript: builder.mutation<any, { scriptId: string; data: any }>({
      query: ({ scriptId, data }) => ({
        url: `/ai/scripts/${scriptId}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deleteScript: builder.mutation<void, string>({
      query: (scriptId) => ({
        url: `/ai/scripts/${scriptId}`,
        method: 'DELETE',
      }),
    }),

    generateInsights: builder.mutation<
      any[],
      { contactId: string; interactions?: any[]; analysisTypes?: string[] }
    >({
      query: (payload) => ({
        url: '/ai/generate-insights',
        method: 'POST',
        body: payload,
      }),
    }),

    getInsights: builder.query<any[], string>({
      query: (contactId) => `/ai/insights/${contactId}`,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetInteractionsQuery,
  useCreateInteractionMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  // AI hooks
  useGenerateAIResponseMutation,
  useAnalyzeProfileMutation,
  useGetAnalysisQuery,
  useGenerateScriptMutation,
  useGetScriptsQuery,
  useSaveScriptMutation,
  useUpdateScriptMutation,
  useDeleteScriptMutation,
  useGenerateInsightsMutation,
  useGetInsightsQuery,
} = api;