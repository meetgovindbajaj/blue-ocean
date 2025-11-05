# Blue Ocean Copilot - Intelligent Agent System

## Overview

Blue Ocean Copilot is a super intelligent AI agent system designed for the Blue Ocean furniture export business. It provides advanced capabilities including natural language understanding, semantic search, product recommendations, business insights, and code analysis.

## Features

### Core Capabilities

1. **Natural Language Understanding**
   - Context-aware responses
   - Multi-turn conversation handling
   - Intent recognition and entity extraction

2. **Semantic Search**
   - Fuzzy matching using Fuse.js
   - Search across products, categories, and documentation
   - Intelligent result ranking and relevance scoring

3. **Product Recommendations**
   - AI-powered product suggestions
   - Personalized recommendations based on user needs
   - Category-aware filtering

4. **Business Insights**
   - Analytics and reporting
   - Data-driven recommendations
   - Performance metrics

5. **Code Analysis**
   - Code explanation and documentation
   - Best practices suggestions
   - API guidance

6. **Context Management**
   - Conversation history tracking
   - Memory and preference retention
   - Context compression for long conversations

## Architecture

### Components

```
src/
├── types/agent.d.ts                  # TypeScript type definitions
├── models/Conversation.ts            # MongoDB conversation model
├── lib/agent/
│   ├── config.ts                     # Agent configuration
│   ├── contextManager.ts             # Context and memory management
│   ├── semanticSearch.ts             # Semantic search service
│   ├── promptBuilder.ts              # Prompt engineering
│   ├── agentService.ts               # Main agent service
│   └── index.ts                      # Exports
├── app/(server)/api/v1/agent/
│   ├── chat/route.ts                 # Chat endpoint
│   ├── search/route.ts               # Search endpoint
│   └── config/route.ts               # Config endpoint
└── components/agent/
    ├── AgentChat.tsx                 # Main chat component
    ├── AgentChat.module.scss         # Chat styles
    ├── AgentWidget.tsx               # Floating widget
    ├── AgentWidget.module.scss       # Widget styles
    └── index.ts                      # Component exports
```

## Installation

The agent system is already integrated into the Blue Ocean application. No additional installation is required.

## API Endpoints

### 1. Chat with Agent

**POST** `/api/v1/agent/chat`

Send a message to the agent and receive a response.

**Request Body:**
```json
{
  "message": "Show me furniture for living room",
  "conversationId": "optional-conversation-id",
  "userId": "optional-user-id",
  "context": {
    "currentPage": "/products",
    "userRole": "customer"
  }
}
```

**Response:**
```json
{
  "conversationId": "uuid",
  "message": "Here are some living room furniture options...",
  "suggestions": ["Modern sofas", "Coffee tables", "TV stands"],
  "actions": [
    {
      "type": "navigate",
      "payload": { "productId": "123" },
      "description": "View Modern Sofa"
    }
  ],
  "metadata": {
    "processingTime": 250,
    "confidence": 0.9,
    "sources": ["product-123", "category-456"]
  }
}
```

### 2. Get Conversation History

**GET** `/api/v1/agent/chat?conversationId={id}`

Retrieve conversation history.

**Response:**
```json
{
  "conversationId": "uuid",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Show me furniture",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "agent",
      "content": "Here are some options...",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  ]
}
```

### 3. Clear Conversation

**DELETE** `/api/v1/agent/chat?conversationId={id}`

Clear conversation history.

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared successfully"
}
```

### 4. Semantic Search

**POST** `/api/v1/agent/search`

Perform semantic search across the system.

**Request Body:**
```json
{
  "query": "wooden dining table",
  "limit": 10,
  "type": "products"  // optional: "products", "categories", "documentation"
}
```

**Response:**
```json
{
  "query": "wooden dining table",
  "results": [
    {
      "id": "prod-123",
      "type": "product",
      "title": "Oak Dining Table",
      "description": "Solid oak dining table...",
      "score": 0.95,
      "metadata": {
        "slug": "oak-dining-table"
      }
    }
  ],
  "count": 5
}
```

### 5. Get Suggestions

**GET** `/api/v1/agent/search/suggestions?q={query}&limit={limit}`

Get search suggestions.

**Response:**
```json
{
  "query": "din",
  "suggestions": ["Dining Table", "Dining Chair", "Dining Set"]
}
```

### 6. Get Agent Configuration

**GET** `/api/v1/agent/config`

Get agent capabilities and configuration.

**Response:**
```json
{
  "name": "Blue Ocean Copilot",
  "version": "1.0.0",
  "capabilities": [
    {
      "name": "semantic_search",
      "description": "Advanced search using natural language understanding"
    },
    {
      "name": "product_recommendation",
      "description": "Intelligent product suggestions based on user needs"
    }
  ],
  "maxContextLength": 4000,
  "maxResponseLength": 1000
}
```

## Usage

### Using the Chat Component

```tsx
import { AgentChat } from "@/components/agent";

export default function MyPage() {
  return (
    <div>
      <h1>Chat with AI Assistant</h1>
      <AgentChat 
        userId="user-123"
        onConversationIdChange={(id) => console.log("Conversation:", id)}
      />
    </div>
  );
}
```

### Using the Widget

```tsx
import { AgentWidget } from "@/components/agent";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <AgentWidget />
    </>
  );
}
```

### Direct API Usage

```typescript
// Send a message
const response = await fetch('/api/v1/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me modern sofas',
    conversationId: 'optional-id'
  })
});

const data = await response.json();
console.log(data.message); // Agent response
```

### Using the Agent Service Directly

```typescript
import { agentService } from "@/lib/agent";

// Initialize (called automatically on first use)
await agentService.initialize();

// Process a request
const response = await agentService.processRequest({
  message: "Find me furniture for bedroom",
  conversationId: "optional-id",
  userId: "user-123"
});

console.log(response.message);
console.log(response.suggestions);
```

## Configuration

### Agent Configuration

Edit `/src/lib/agent/config.ts` to customize:

```typescript
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "Blue Ocean Copilot",
  version: "1.0.0",
  maxContextLength: 4000,      // Max tokens in context
  maxResponseLength: 1000,     // Max tokens in response
  temperature: 0.7,            // Response creativity (0-1)
  systemPrompt: "...",         // System instructions
  capabilities: [...]          // Enabled capabilities
};
```

### Context Settings

```typescript
export const CONTEXT_SETTINGS = {
  maxMessagesInContext: 20,              // Messages to keep in context
  maxContextAge: 24 * 60 * 60 * 1000,   // 24 hours
  contextCompressionThreshold: 10,       // When to compress
  priorityKeywords: [...]                // Important keywords
};
```

## Customization

### Adding Custom Capabilities

1. Define capability in types:

```typescript
// src/types/agent.d.ts
export type AgentCapability = 
  | "existing_capability"
  | "your_new_capability";
```

2. Add to configuration:

```typescript
// src/lib/agent/config.ts
export const CAPABILITY_DESCRIPTIONS = {
  your_new_capability: "Description of your capability",
};
```

3. Implement handler in AgentService:

```typescript
// src/lib/agent/agentService.ts
private async handleYourCapability(query: string) {
  // Your implementation
  return {
    message: "Response",
    suggestions: []
  };
}
```

### Adding Prompt Templates

```typescript
// src/lib/agent/config.ts
export const PROMPT_TEMPLATES = {
  yourTemplate: {
    name: "Your Template",
    template: "Your prompt with {variable}",
    variables: ["variable"],
    category: "instruction" as const,
  },
};
```

## Database Schema

### Conversation Model

```typescript
{
  conversationId: String,     // Unique conversation ID
  userId: String,             // Optional user ID
  messages: [{
    id: String,
    role: "user" | "agent" | "system",
    content: String,
    timestamp: Date,
    metadata: Object
  }],
  metadata: {
    startTime: Date,
    lastUpdate: Date,
    messageCount: Number,
    topic: String,
    status: "active" | "archived" | "deleted"
  },
  analytics: {
    avgResponseTime: Number,
    totalTokens: Number,
    userSatisfaction: Number
  }
}
```

## Performance

- Average response time: 200-500ms
- Semantic search: <100ms
- Context management: In-memory with database backup
- Automatic context cleanup for old conversations

## Best Practices

1. **Context Management**
   - Keep conversations focused on specific topics
   - Clear old conversations to save resources
   - Use conversationId to maintain context across sessions

2. **Error Handling**
   - Always handle API errors gracefully
   - Provide fallback responses
   - Log errors for debugging

3. **Performance**
   - Initialize agent service once
   - Use pagination for large result sets
   - Cache frequently accessed data

4. **Security**
   - Sanitize user inputs
   - Validate conversation ownership
   - Implement rate limiting in production

## Troubleshooting

### Agent Not Responding

1. Check if service is initialized:
```typescript
await agentService.initialize();
```

2. Verify database connection
3. Check API endpoint accessibility

### Search Not Working

1. Ensure semantic search is initialized:
```typescript
await semanticSearchService.initialize();
```

2. Check if products/categories exist in database
3. Verify Fuse.js configuration

### Context Not Persisting

1. Verify conversationId is passed correctly
2. Check database connectivity
3. Ensure conversation is saved after each message

## Future Enhancements

- Integration with external AI models (OpenAI, Anthropic)
- Voice interaction support
- Multi-language support
- Advanced analytics and reporting
- Custom training on business data
- Integration with CRM systems
- Automated workflow triggers

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses
3. Check browser console for errors
4. Verify database connectivity

## License

Part of the Blue Ocean project. All rights reserved.
