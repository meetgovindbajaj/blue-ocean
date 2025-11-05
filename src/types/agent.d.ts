/**
 * Type definitions for the Intelligent Agent System
 */

export interface AgentMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    context?: string[];
  };
}

export interface ConversationContext {
  conversationId: string;
  userId?: string;
  messages: AgentMessage[];
  metadata: {
    startTime: Date;
    lastUpdate: Date;
    messageCount: number;
    topic?: string;
  };
}

export interface AgentConfig {
  name: string;
  version: string;
  maxContextLength: number;
  maxResponseLength: number;
  temperature?: number;
  systemPrompt: string;
  capabilities: AgentCapability[];
}

export type AgentCapability =
  | "semantic_search"
  | "code_analysis"
  | "product_recommendation"
  | "business_insights"
  | "documentation"
  | "query_optimization"
  | "natural_language_processing";

export interface AgentRequest {
  conversationId?: string;
  message: string;
  userId?: string;
  context?: {
    currentPage?: string;
    userRole?: string;
    additionalContext?: Record<string, unknown>;
  };
}

export interface AgentResponse {
  conversationId: string;
  message: string;
  suggestions?: string[];
  actions?: AgentAction[];
  metadata: {
    processingTime: number;
    confidence: number;
    sources?: string[];
  };
}

export interface AgentAction {
  type: "navigate" | "search" | "filter" | "recommend" | "explain";
  payload: Record<string, unknown>;
  description: string;
}

export interface SearchResult {
  id: string;
  type: "product" | "category" | "documentation" | "code";
  title: string;
  description: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface AgentMemory {
  conversationId: string;
  shortTermMemory: AgentMessage[];
  longTermMemory: {
    topics: string[];
    preferences: Record<string, unknown>;
    context: string[];
  };
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  category: "system" | "user" | "instruction";
}

export interface AgentAnalytics {
  conversationId: string;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  userSatisfaction?: number;
  topTopics: string[];
}
