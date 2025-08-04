export { default as ChatAssistant } from './ChatAssistant';
export { default as ProfileAnalysis } from './ProfileAnalysis';
export { default as ScriptGenerator } from './ScriptGenerator';
export { default as InsightPanel } from './InsightPanel';

// Re-export types for convenience
export type { AIMessage, ChatContext, SalesScript, AIAnalysis } from '../../types/ai';
export type { AIInsight, AIPrompt } from '../../store/slices/aiSlice';