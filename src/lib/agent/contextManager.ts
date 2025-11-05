import {
  AgentMessage,
  ConversationContext,
  AgentMemory,
} from "@/types/agent";
import { CONTEXT_SETTINGS } from "./config";

/**
 * Manages conversation context and memory
 */
export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private memories: Map<string, AgentMemory> = new Map();

  /**
   * Create a new conversation context
   */
  createContext(conversationId: string, userId?: string): ConversationContext {
    const context: ConversationContext = {
      conversationId,
      userId,
      messages: [],
      metadata: {
        startTime: new Date(),
        lastUpdate: new Date(),
        messageCount: 0,
      },
    };
    this.contexts.set(conversationId, context);
    this.initializeMemory(conversationId);
    return context;
  }

  /**
   * Initialize memory for a conversation
   */
  private initializeMemory(conversationId: string): void {
    const memory: AgentMemory = {
      conversationId,
      shortTermMemory: [],
      longTermMemory: {
        topics: [],
        preferences: {},
        context: [],
      },
    };
    this.memories.set(conversationId, memory);
  }

  /**
   * Get conversation context
   */
  getContext(conversationId: string): ConversationContext | undefined {
    return this.contexts.get(conversationId);
  }

  /**
   * Add message to context
   */
  addMessage(conversationId: string, message: AgentMessage): void {
    const context = this.contexts.get(conversationId);
    if (!context) {
      throw new Error(`Context not found for conversation: ${conversationId}`);
    }

    context.messages.push(message);
    context.metadata.messageCount += 1;
    context.metadata.lastUpdate = new Date();

    // Update memory
    this.updateMemory(conversationId, message);

    // Compress context if needed
    if (context.messages.length > CONTEXT_SETTINGS.maxMessagesInContext) {
      this.compressContext(conversationId);
    }
  }

  /**
   * Update memory with new message
   */
  private updateMemory(conversationId: string, message: AgentMessage): void {
    const memory = this.memories.get(conversationId);
    if (!memory) return;

    // Add to short-term memory
    memory.shortTermMemory.push(message);
    if (memory.shortTermMemory.length > CONTEXT_SETTINGS.maxMessagesInContext) {
      memory.shortTermMemory.shift();
    }

    // Extract topics and context
    const topics = this.extractTopics(message.content);
    memory.longTermMemory.topics = [
      ...new Set([...memory.longTermMemory.topics, ...topics]),
    ].slice(-10); // Keep last 10 unique topics

    // Update context keywords
    const keywords = this.extractKeywords(message.content);
    memory.longTermMemory.context = [
      ...new Set([...memory.longTermMemory.context, ...keywords]),
    ].slice(-20); // Keep last 20 unique keywords
  }

  /**
   * Extract topics from message content
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for priority keywords
    for (const keyword of CONTEXT_SETTINGS.priorityKeywords) {
      if (lowerContent.includes(keyword)) {
        topics.push(keyword);
      }
    }

    return topics;
  }

  /**
   * Extract keywords from message content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - split by spaces and filter
    const words = content.toLowerCase().split(/\s+/);
    return words
      .filter((word) => word.length > CONTEXT_SETTINGS.minKeywordLength && !this.isStopWord(word))
      .slice(0, CONTEXT_SETTINGS.maxKeywordsPerMessage);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "her",
      "was",
      "one",
      "our",
      "out",
      "this",
      "that",
      "with",
      "have",
      "from",
      "they",
      "what",
      "been",
      "more",
      "when",
      "your",
    ]);
    return stopWords.has(word);
  }

  /**
   * Compress context by removing older messages
   */
  private compressContext(conversationId: string): void {
    const context = this.contexts.get(conversationId);
    if (!context) return;

    // Keep system messages and recent messages
    const systemMessages = context.messages.filter(
      (msg) => msg.role === "system"
    );
    const recentMessages = context.messages
      .filter((msg) => msg.role !== "system")
      .slice(-CONTEXT_SETTINGS.contextCompressionThreshold);

    context.messages = [...systemMessages, ...recentMessages];
  }

  /**
   * Get relevant context for current query
   */
  getRelevantContext(conversationId: string, query: string): AgentMessage[] {
    const context = this.contexts.get(conversationId);
    if (!context) return [];

    // Get recent messages
    const recentMessages = context.messages.slice(
      -CONTEXT_SETTINGS.maxMessagesInContext
    );

    // Filter by relevance to current query
    const queryLower = query.toLowerCase();
    const relevantMessages = recentMessages.filter((msg) => {
      const content = msg.content.toLowerCase();
      return CONTEXT_SETTINGS.priorityKeywords.some((keyword) =>
        content.includes(keyword) && queryLower.includes(keyword)
      );
    });

    // If no relevant messages found, return recent messages
    return relevantMessages.length > 0 ? relevantMessages : recentMessages.slice(-5);
  }

  /**
   * Get memory for a conversation
   */
  getMemory(conversationId: string): AgentMemory | undefined {
    return this.memories.get(conversationId);
  }

  /**
   * Clear old contexts
   */
  clearOldContexts(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.contexts.forEach((context, id) => {
      const age = now - context.metadata.lastUpdate.getTime();
      if (age > CONTEXT_SETTINGS.maxContextAge) {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => {
      this.contexts.delete(id);
      this.memories.delete(id);
    });
  }

  /**
   * Get all active conversation IDs for a user
   */
  getUserConversations(userId: string): string[] {
    const conversations: string[] = [];
    this.contexts.forEach((context, id) => {
      if (context.userId === userId) {
        conversations.push(id);
      }
    });
    return conversations;
  }

  /**
   * Delete a conversation context
   */
  deleteContext(conversationId: string): boolean {
    const deleted = this.contexts.delete(conversationId);
    this.memories.delete(conversationId);
    return deleted;
  }
}

// Singleton instance
export const contextManager = new ContextManager();
