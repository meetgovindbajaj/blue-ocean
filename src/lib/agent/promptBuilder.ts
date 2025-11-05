import { AgentMessage } from "@/types/agent";
import { DEFAULT_AGENT_CONFIG, PROMPT_TEMPLATES } from "./config";

/**
 * Build prompts for agent interactions
 */
export class PromptBuilder {
  /**
   * Build system prompt
   */
  buildSystemPrompt(): string {
    return DEFAULT_AGENT_CONFIG.systemPrompt;
  }

  /**
   * Build context prompt from message history
   */
  buildContextPrompt(messages: AgentMessage[]): string {
    if (messages.length === 0) {
      return "";
    }

    const contextMessages = messages
      .slice(-10) // Last 10 messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Agent";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    return `Previous conversation:\n${contextMessages}\n`;
  }

  /**
   * Build prompt from template
   */
  buildFromTemplate(
    templateName: keyof typeof PROMPT_TEMPLATES,
    variables: Record<string, string>
  ): string {
    const template = PROMPT_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let prompt = template.template;

    // Replace variables
    template.variables.forEach((variable) => {
      const value = variables[variable] || "";
      prompt = prompt.replace(new RegExp(`{${variable}}`, "g"), value);
    });

    return prompt;
  }

  /**
   * Build complete prompt for agent
   */
  buildCompletePrompt(
    userMessage: string,
    context: AgentMessage[],
    additionalContext?: string
  ): string {
    const parts: string[] = [];

    // System prompt
    parts.push(this.buildSystemPrompt());

    // Context from previous messages
    if (context.length > 0) {
      parts.push(this.buildContextPrompt(context));
    }

    // Additional context if provided
    if (additionalContext) {
      parts.push(`Additional context:\n${additionalContext}\n`);
    }

    // Current user message
    parts.push(`User: ${userMessage}`);

    return parts.join("\n\n");
  }

  /**
   * Build product recommendation prompt
   */
  buildProductRecommendationPrompt(
    requirements: string,
    products: Array<{
      name: string;
      description: string;
      price: number;
      category: string;
    }>
  ): string {
    const productsText = products
      .map(
        (p) =>
          `- ${p.name} (${p.category}): ${p.description} - $${p.price}`
      )
      .join("\n");

    return this.buildFromTemplate("productRecommendation", {
      requirements,
      products: productsText,
    });
  }

  /**
   * Build code analysis prompt
   */
  buildCodeAnalysisPrompt(code: string, context: string): string {
    return this.buildFromTemplate("codeAnalysis", {
      code,
      context,
    });
  }

  /**
   * Build business insights prompt
   */
  buildBusinessInsightsPrompt(
    data: Record<string, unknown>,
    context: string
  ): string {
    const dataText = JSON.stringify(data, null, 2);
    return this.buildFromTemplate("businessInsights", {
      data: dataText,
      context,
    });
  }

  /**
   * Build semantic search prompt
   */
  buildSemanticSearchPrompt(query: string, searchContext: string): string {
    return this.buildFromTemplate("semanticSearch", {
      query,
      searchContext,
    });
  }

  /**
   * Build documentation prompt
   */
  buildDocumentationPrompt(
    subject: string,
    includeItems: string[],
    format: string
  ): string {
    return this.buildFromTemplate("documentation", {
      subject,
      includeItems: includeItems.join(", "),
      format,
    });
  }

  /**
   * Extract intent from user message
   */
  extractIntent(message: string): {
    intent: string;
    confidence: number;
    entities: string[];
  } {
    const lowerMessage = message.toLowerCase();

    // Define intent patterns
    const intentPatterns = [
      {
        intent: "product_search",
        keywords: ["find", "search", "show", "looking for", "need"],
        weight: 0.8,
      },
      {
        intent: "product_recommendation",
        keywords: ["recommend", "suggest", "best", "which", "should i"],
        weight: 0.9,
      },
      {
        intent: "product_inquiry",
        keywords: ["price", "cost", "size", "dimension", "material"],
        weight: 0.85,
      },
      {
        intent: "code_help",
        keywords: ["code", "function", "api", "endpoint", "implement"],
        weight: 0.9,
      },
      {
        intent: "business_analytics",
        keywords: ["sales", "analytics", "insights", "report", "data"],
        weight: 0.85,
      },
      {
        intent: "general_question",
        keywords: ["what", "how", "why", "when", "tell me"],
        weight: 0.7,
      },
    ];

    let bestIntent = "general_question";
    let bestScore = 0;

    // Calculate scores for each intent
    intentPatterns.forEach((pattern) => {
      const matches = pattern.keywords.filter((keyword) =>
        lowerMessage.includes(keyword)
      );
      const score = (matches.length / pattern.keywords.length) * pattern.weight;

      if (score > bestScore) {
        bestScore = score;
        bestIntent = pattern.intent;
      }
    });

    // Extract entities (simple keyword extraction)
    const entities = this.extractEntities(message);

    return {
      intent: bestIntent,
      confidence: Math.min(bestScore, 1),
      entities,
    };
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): string[] {
    const entities: string[] = [];
    const words = message.split(/\s+/);

    // Look for capitalized words (potential product names)
    words.forEach((word) => {
      if (word.length > 2 && /^[A-Z]/.test(word)) {
        entities.push(word);
      }
    });

    // Look for numbers (potential quantities, prices)
    const numbers = message.match(/\d+/g);
    if (numbers) {
      entities.push(...numbers);
    }

    return entities;
  }

  /**
   * Compress context for long conversations
   */
  compressContext(messages: AgentMessage[]): string {
    if (messages.length === 0) return "";

    // Summarize older messages
    const summary = messages
      .slice(0, -5)
      .map((msg) => `${msg.role}: ${msg.content.slice(0, 50)}...`)
      .join("\n");

    // Keep full recent messages
    const recent = messages
      .slice(-5)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    return `Earlier conversation summary:\n${summary}\n\nRecent messages:\n${recent}`;
  }

  /**
   * Format response for better readability
   */
  formatResponse(response: string, format: "markdown" | "plain" = "plain"): string {
    if (format === "markdown") {
      // Add markdown formatting
      response = response
        .replace(/\*\*([^*]+)\*\*/g, "**$1**") // Bold
        .replace(/\*([^*]+)\*/g, "*$1*"); // Italic
    }

    return response;
  }
}

// Singleton instance
export const promptBuilder = new PromptBuilder();
