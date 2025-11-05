# Blue Ocean Copilot - Quick Start Guide

## Overview

This guide will help you quickly get started with the Blue Ocean Copilot intelligent agent system.

## What is Blue Ocean Copilot?

Blue Ocean Copilot is an AI-powered assistant designed specifically for the furniture export business. It provides:

- Natural language search and product discovery
- Intelligent product recommendations
- Business insights and analytics
- Code and API assistance
- Multi-turn contextual conversations

## Quick Start

### 1. Access the Agent

There are three ways to interact with the agent:

#### Option A: Dedicated Page
Visit `/agent` on your application to access the full chat interface.

#### Option B: Widget
Add the floating widget to any page:

```tsx
import { AgentWidget } from "@/components/agent";

export default function MyLayout({ children }) {
  return (
    <>
      {children}
      <AgentWidget />
    </>
  );
}
```

#### Option C: Embedded Chat
Embed the chat component anywhere:

```tsx
import { AgentChat } from "@/components/agent";

export default function MyPage() {
  return (
    <div>
      <AgentChat />
    </div>
  );
}
```

### 2. Sample Conversations

Try these example queries:

**Product Search:**
- "Show me modern sofas"
- "Find dining tables under $500"
- "What bedroom furniture do you have?"

**Recommendations:**
- "Recommend furniture for a small apartment"
- "What goes well with a leather sofa?"
- "Best products for outdoor spaces"

**Business Insights:**
- "What are the top selling products?"
- "Show me category performance"
- "Analyze sales trends"

**Technical Help:**
- "How do I use the product API?"
- "Explain the search endpoint"
- "Show me code examples"

### 3. API Usage

#### Send a Message

```typescript
const response = await fetch('/api/v1/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me modern sofas',
    conversationId: 'optional-conversation-id',
    userId: 'optional-user-id'
  })
});

const data = await response.json();
console.log(data.message); // Agent's response
console.log(data.suggestions); // Suggested follow-up questions
```

#### Semantic Search

```typescript
const response = await fetch('/api/v1/agent/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'wooden dining table',
    limit: 10,
    type: 'products' // or 'categories', 'documentation'
  })
});

const data = await response.json();
console.log(data.results); // Search results with relevance scores
```

#### Get Agent Config

```typescript
const response = await fetch('/api/v1/agent/config');
const config = await response.json();
console.log(config.capabilities); // List of agent capabilities
```

## Features

### 🔍 Semantic Search
- Fuzzy matching with Fuse.js
- Natural language queries
- Relevance scoring
- Search across products, categories, and documentation

### 💬 Conversational AI
- Context-aware responses
- Multi-turn conversations
- Intent recognition
- Entity extraction

### 🧠 Memory & Context
- Conversation history tracking
- Short-term and long-term memory
- Automatic context compression
- Priority keyword detection

### 🎯 Smart Recommendations
- Product suggestions based on user needs
- Category-aware filtering
- Personalized recommendations

### 📊 Business Intelligence
- Analytics and insights
- Performance metrics
- Data-driven recommendations

### 🔧 Developer Support
- Code analysis and explanation
- API documentation
- Best practices guidance

## Configuration

### Customize the Agent

Edit `/src/lib/agent/config.ts`:

```typescript
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "Blue Ocean Copilot",
  version: "1.0.0",
  maxContextLength: 4000,
  maxResponseLength: 1000,
  temperature: 0.7,
  systemPrompt: "Your custom system prompt...",
  capabilities: [
    "semantic_search",
    "product_recommendation",
    // ... more capabilities
  ],
};
```

### Adjust Context Settings

```typescript
export const CONTEXT_SETTINGS = {
  maxMessagesInContext: 20,
  maxContextAge: 24 * 60 * 60 * 1000, // 24 hours
  contextCompressionThreshold: 10,
  priorityKeywords: ["product", "price", "furniture", ...],
};
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend Components               │
│  ┌─────────────┐     ┌──────────────┐      │
│  │ AgentChat   │     │ AgentWidget  │      │
│  └─────────────┘     └──────────────┘      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│              API Endpoints                   │
│  /api/v1/agent/chat                         │
│  /api/v1/agent/search                       │
│  /api/v1/agent/config                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           Agent Service Layer               │
│  ┌──────────────┐  ┌─────────────────┐     │
│  │ AgentService │  │ SemanticSearch  │     │
│  └──────────────┘  └─────────────────┘     │
│  ┌──────────────┐  ┌─────────────────┐     │
│  │ ContextMgr   │  │ PromptBuilder   │     │
│  └──────────────┘  └─────────────────┘     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Database (MongoDB)                   │
│  - Conversation History                      │
│  - Products & Categories                     │
│  - Analytics                                 │
└─────────────────────────────────────────────┘
```

## Best Practices

1. **Maintain Context**: Use the same `conversationId` for related messages to maintain context

2. **Handle Errors**: Always implement error handling for API calls

3. **User Feedback**: Use the suggestions provided by the agent for better UX

4. **Rate Limiting**: Implement rate limiting in production to prevent abuse

5. **Clear Old Conversations**: Periodically clear old conversations to save resources

## Performance

- Average response time: 200-500ms
- Semantic search: <100ms
- Concurrent conversations: Unlimited (memory-based)
- Context retention: 24 hours (configurable)

## Troubleshooting

### Agent Not Responding
1. Check if the API endpoint is accessible
2. Verify database connection
3. Check browser console for errors

### Search Returns No Results
1. Ensure products exist in the database
2. Check if semantic search is initialized
3. Try different search terms

### Context Not Persisting
1. Verify `conversationId` is being passed
2. Check database connectivity
3. Ensure conversation is within the retention period

## Next Steps

1. Read the [full documentation](../AGENT_DOCUMENTATION.md)
2. Explore the example queries on the `/agent` page
3. Customize the agent configuration for your needs
4. Integrate the widget into your application
5. Monitor agent performance and user feedback

## Support

For detailed documentation, see [AGENT_DOCUMENTATION.md](../AGENT_DOCUMENTATION.md)

For issues or questions:
1. Check the troubleshooting section
2. Review API responses
3. Check application logs

## License

Part of the Blue Ocean project.
