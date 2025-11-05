import { AgentConfig } from "@/types/agent";

/**
 * Default configuration for the Intelligent Agent
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "Blue Ocean Copilot",
  version: "1.0.0",
  maxContextLength: 4000,
  maxResponseLength: 1000,
  temperature: 0.7,
  systemPrompt: `You are Blue Ocean Copilot, an intelligent assistant for a furniture export business. 
You have expertise in:
- Furniture products, categories, and specifications
- Business operations and insights
- Customer service and recommendations
- Code analysis and technical support for the platform
- Documentation and knowledge management

Your role is to:
1. Provide accurate and helpful information about products
2. Assist customers with product selection and recommendations
3. Help analyze business data and generate insights
4. Support developers with code-related questions
5. Maintain context throughout conversations
6. Offer proactive suggestions when relevant

Always be professional, accurate, and helpful. If you're unsure about something, acknowledge it and offer to find the information or suggest alternatives.`,
  capabilities: [
    "semantic_search",
    "code_analysis",
    "product_recommendation",
    "business_insights",
    "documentation",
    "query_optimization",
    "natural_language_processing",
  ],
};

/**
 * Prompt templates for different scenarios
 */
export const PROMPT_TEMPLATES = {
  productRecommendation: {
    name: "Product Recommendation",
    template: `Based on the user's requirements: {requirements}
Available products: {products}

Please recommend the most suitable products and explain why they would be a good fit.`,
    variables: ["requirements", "products"],
    category: "instruction" as const,
  },

  codeAnalysis: {
    name: "Code Analysis",
    template: `Analyze the following code:
{code}

Context: {context}

Provide insights on functionality, potential improvements, and any issues.`,
    variables: ["code", "context"],
    category: "instruction" as const,
  },

  businessInsights: {
    name: "Business Insights",
    template: `Generate business insights based on:
Data: {data}
Context: {context}

Provide actionable insights and recommendations.`,
    variables: ["data", "context"],
    category: "instruction" as const,
  },

  semanticSearch: {
    name: "Semantic Search",
    template: `User query: {query}
Search context: {searchContext}

Find the most relevant results and explain their relevance.`,
    variables: ["query", "searchContext"],
    category: "instruction" as const,
  },

  documentation: {
    name: "Documentation",
    template: `Generate documentation for:
{subject}

Include: {includeItems}
Format: {format}`,
    variables: ["subject", "includeItems", "format"],
    category: "instruction" as const,
  },
};

/**
 * Agent capability descriptions
 */
export const CAPABILITY_DESCRIPTIONS = {
  semantic_search: "Advanced search using natural language understanding",
  code_analysis: "Analyze and explain code functionality and quality",
  product_recommendation: "Intelligent product suggestions based on user needs",
  business_insights: "Generate actionable business intelligence",
  documentation: "Create and maintain comprehensive documentation",
  query_optimization: "Optimize database and search queries",
  natural_language_processing: "Understand and process natural language",
};

/**
 * Response formatting options
 */
export const RESPONSE_FORMATS = {
  markdown: "markdown",
  json: "json",
  plain: "plain",
  html: "html",
} as const;

/**
 * Context retention settings
 */
export const CONTEXT_SETTINGS = {
  maxMessagesInContext: 20,
  maxContextAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  contextCompressionThreshold: 10,
  priorityKeywords: [
    "product",
    "price",
    "furniture",
    "order",
    "category",
    "customer",
    "export",
    "wholesale",
    "retail",
  ],
  // Keyword extraction settings
  minKeywordLength: 3,
  maxKeywordsPerMessage: 5,
};

/**
 * Search distribution ratios
 */
export const SEARCH_SETTINGS = {
  productResultRatio: 0.5, // 50% of results
  categoryResultRatio: 0.25, // 25% of results
  documentationResultRatio: 0.25, // 25% of results
};

/**
 * Display settings
 */
export const DISPLAY_SETTINGS = {
  maxDescriptionLength: 100,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  CONTEXT_TOO_LONG: "The conversation context is too long. Please start a new conversation.",
  INVALID_REQUEST: "Invalid request format. Please check your input.",
  SERVICE_UNAVAILABLE: "The agent service is temporarily unavailable. Please try again later.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please wait before sending more messages.",
  CONVERSATION_NOT_FOUND: "Conversation not found. Please start a new conversation.",
};
