import {
  AgentRequest,
  AgentResponse,
  AgentMessage,
  AgentAction,
} from "@/types/agent";
import { contextManager } from "./contextManager";
import { semanticSearchService } from "./semanticSearch";
import { promptBuilder } from "./promptBuilder";
import { DEFAULT_AGENT_CONFIG, ERROR_MESSAGES } from "./config";
import { v4 as uuidv4 } from "uuid";
import Conversation, { IAgentMessage } from "@/models/Conversation";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

/**
 * Main Agent Service for handling intelligent interactions
 */
export class AgentService {
  private initialized: boolean = false;

  /**
   * Initialize the agent service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await semanticSearchService.initialize();
      this.initialized = true;
      console.log("Agent service initialized successfully");
    } catch (error) {
      console.error("Error initializing agent service:", error);
      throw error;
    }
  }

  /**
   * Process a user request and generate response
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Validate request
      if (!request.message || request.message.trim().length === 0) {
        throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
      }

      // Get or create conversation
      const conversationId = request.conversationId || uuidv4();
      let context = contextManager.getContext(conversationId);

      if (!context) {
        context = contextManager.createContext(conversationId, request.userId);
      }

      // Create user message
      const userMessage: AgentMessage = {
        id: uuidv4(),
        role: "user",
        content: request.message,
        timestamp: new Date(),
      };

      // Add user message to context
      contextManager.addMessage(conversationId, userMessage);

      // Extract intent from message
      const intent = promptBuilder.extractIntent(request.message);

      // Generate response based on intent
      const response = await this.generateResponse(
        request,
        context.messages,
        intent
      );

      // Create agent message
      const agentMessage: AgentMessage = {
        id: uuidv4(),
        role: "agent",
        content: response.message,
        timestamp: new Date(),
        metadata: {
          model: DEFAULT_AGENT_CONFIG.name,
          context: intent.entities,
        },
      };

      // Add agent message to context
      contextManager.addMessage(conversationId, agentMessage);

      // Save conversation to database
      await this.saveConversation(conversationId, context.messages, request.userId);

      const processingTime = Date.now() - startTime;

      return {
        conversationId,
        message: response.message,
        suggestions: response.suggestions,
        actions: response.actions,
        metadata: {
          processingTime,
          confidence: intent.confidence,
          sources: response.sources,
        },
      };
    } catch (error) {
      console.error("Error processing request:", error);
      throw error;
    }
  }

  /**
   * Generate response based on intent and context
   */
  private async generateResponse(
    request: AgentRequest,
    messageHistory: AgentMessage[],
    intent: { intent: string; confidence: number; entities: string[] }
  ): Promise<{
    message: string;
    suggestions?: string[];
    actions?: AgentAction[];
    sources?: string[];
  }> {
    const { message } = request;

    switch (intent.intent) {
      case "product_search":
        return await this.handleProductSearch(message);

      case "product_recommendation":
        return await this.handleProductRecommendation(message);

      case "product_inquiry":
        return await this.handleProductInquiry(message, intent.entities);

      case "code_help":
        return await this.handleCodeHelp(message);

      case "business_analytics":
        return await this.handleBusinessAnalytics(message);

      default:
        return await this.handleGeneralQuestion(message, messageHistory);
    }
  }

  /**
   * Handle product search requests
   */
  private async handleProductSearch(query: string): Promise<{
    message: string;
    suggestions?: string[];
    actions?: AgentAction[];
    sources?: string[];
  }> {
    const results = await semanticSearchService.searchProducts(query, 5);

    if (results.length === 0) {
      return {
        message: `I couldn't find any products matching "${query}". Could you provide more details or try different keywords?`,
        suggestions: [
          "Show all categories",
          "Browse featured products",
          "Search by category",
        ],
      };
    }

    const productList = results
      .map((r, idx) => `${idx + 1}. ${r.title} - ${r.description}`)
      .join("\n");

    const message = `I found ${results.length} products matching your search:\n\n${productList}\n\nWould you like more details about any of these products?`;

    const actions: AgentAction[] = results.map((r) => ({
      type: "navigate",
      payload: { productId: r.id },
      description: `View ${r.title}`,
    }));

    return {
      message,
      actions,
      suggestions: results.map((r) => r.title),
      sources: results.map((r) => r.id),
    };
  }

  /**
   * Handle product recommendation requests
   */
  private async handleProductRecommendation(_query: string): Promise<{
    message: string;
    suggestions?: string[];
    actions?: AgentAction[];
  }> {
    try {
      await dbConnect();

      // Get some products for recommendation
      const products = await Product.find({ isActive: true })
        .limit(5)
        .select("name description prices category")
        .populate("category", "name")
        .lean();

      if (products.length === 0) {
        return {
          message: "I don't have enough product information to make recommendations right now. Please check back later.",
          suggestions: ["View all products", "Browse categories"],
        };
      }

      const recommendations = products
        .map(
          (p, idx) =>
            `${idx + 1}. **${p.name}** - ${p.description?.slice(0, 100)}... (Price: $${p.prices?.retail || "N/A"})`
        )
        .join("\n\n");

      const message = `Based on your requirements, here are my recommendations:\n\n${recommendations}\n\nThese products offer great value and quality. Would you like more details about any of them?`;

      return {
        message,
        suggestions: products.map((p) => `Tell me more about ${p.name}`),
        actions: products.map((p) => ({
          type: "recommend",
          payload: { productId: p.id },
          description: `View ${p.name}`,
        })),
      };
    } catch (error) {
      console.error("Error handling product recommendation:", error);
      return {
        message: "I encountered an error while fetching recommendations. Please try again.",
        suggestions: ["Search products", "Browse categories"],
      };
    }
  }

  /**
   * Handle product inquiry (price, size, etc.)
   */
  private async handleProductInquiry(
    query: string,
    _entities: string[]
  ): Promise<{
    message: string;
    suggestions?: string[];
  }> {
    const results = await semanticSearchService.searchProducts(query, 3);

    if (results.length === 0) {
      return {
        message: "I need more information to answer your question. Which product are you asking about?",
        suggestions: ["Show all products", "Search by name"],
      };
    }

    const message = `I can help you with information about these products:\n\n${results.map((r) => `- ${r.title}`).join("\n")}\n\nPlease let me know which one you'd like to know more about.`;

    return {
      message,
      suggestions: results.map((r) => r.title),
    };
  }

  /**
   * Handle code help requests
   */
  private async handleCodeHelp(_query: string): Promise<{
    message: string;
    suggestions?: string[];
  }> {
    const docResults = await semanticSearchService.searchDocumentation(_query, 3);

    const message = `I can help you with code-related questions. Here are some relevant resources:\n\n${docResults.map((r) => `- ${r.title}: ${r.description}`).join("\n")}\n\nWhat specific help do you need?`;

    return {
      message,
      suggestions: [
        "Explain API endpoints",
        "Show code examples",
        "Help with integration",
      ],
    };
  }

  /**
   * Handle business analytics requests
   */
  private async handleBusinessAnalytics(_query: string): Promise<{
    message: string;
    suggestions?: string[];
  }> {
    return {
      message: "I can help you analyze business data and generate insights. What specific metrics or data would you like to analyze?",
      suggestions: [
        "Product performance",
        "Category analysis",
        "Sales trends",
        "Customer insights",
      ],
    };
  }

  /**
   * Handle general questions
   */
  private async handleGeneralQuestion(
    query: string,
    _messageHistory: AgentMessage[]
  ): Promise<{
    message: string;
    suggestions?: string[];
  }> {
    // Search across all types
    const results = await semanticSearchService.search(query, 5);

    if (results.length === 0) {
      return {
        message: `I'm here to help! I can assist you with:\n- Product information and recommendations\n- Category browsing\n- Code and API help\n- Business insights\n\nWhat would you like to know?`,
        suggestions: [
          "Show products",
          "Browse categories",
          "Help with API",
          "Business analytics",
        ],
      };
    }

    const message = `I found some relevant information:\n\n${results.map((r) => `- ${r.title} (${r.type})`).join("\n")}\n\nWould you like more details about any of these?`;

    return {
      message,
      suggestions: results.slice(0, 3).map((r) => r.title),
    };
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    conversationId: string,
    messages: AgentMessage[],
    userId?: string
  ): Promise<void> {
    try {
      await dbConnect();

      const conversation = await Conversation.findOne({ conversationId });

      if (conversation) {
        // Update existing conversation
        conversation.messages = messages.map((msg: AgentMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata,
        }));
        conversation.metadata.lastUpdate = new Date();
        conversation.metadata.messageCount = messages.length;
        await conversation.save();
      } else {
        // Create new conversation
        await Conversation.create({
          conversationId,
          userId,
          messages: messages.map((msg: AgentMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            metadata: msg.metadata,
          })),
          metadata: {
            startTime: new Date(),
            lastUpdate: new Date(),
            messageCount: messages.length,
            status: "active",
          },
        });
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
      // Don't throw - conversation saving is not critical
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<AgentMessage[]> {
    const context = contextManager.getContext(conversationId);
    if (context) {
      return context.messages;
    }

    // Try to load from database
    try {
      await dbConnect();
      const conversation = await Conversation.findOne({ conversationId });
      if (conversation) {
        return conversation.messages.map((msg: IAgentMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata,
        }));
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }

    return [];
  }

  /**
   * Clear conversation
   */
  async clearConversation(conversationId: string): Promise<boolean> {
    return contextManager.deleteContext(conversationId);
  }
}

// Singleton instance
export const agentService = new AgentService();
