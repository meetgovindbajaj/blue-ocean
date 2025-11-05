# Blue Ocean - Furniture Export Business Platform

This is a [Next.js](https://nextjs.org) project for a furniture export business, featuring an intelligent AI-powered Copilot agent system.

## 🌟 Features

- **E-commerce Platform**: Complete furniture catalog with categories, products, and shopping cart
- **AI Copilot Agent**: Intelligent assistant with natural language understanding
- **Admin Dashboard**: Product and category management
- **User Authentication**: Secure login with JWT and OAuth
- **Semantic Search**: Advanced search with fuzzy matching
- **Responsive Design**: Mobile-friendly interface

## 🤖 Blue Ocean Copilot

The AI agent provides:
- Natural language product search
- Intelligent recommendations
- Business insights and analytics
- Code and API assistance
- Multi-turn contextual conversations

### Quick Access
- Demo page: `/agent`
- API endpoints: `/api/v1/agent/*`
- Components: `@/components/agent`

### Documentation
- [Quick Start Guide](AGENT_QUICK_START.md)
- [Full Documentation](AGENT_DOCUMENTATION.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Security Summary](SECURITY_SUMMARY.md)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run storybook    # Start Storybook
```

## Project Structure

```
src/
├── app/
│   ├── (client)/          # Client-side pages
│   │   ├── (users)/       # User-facing pages
│   │   │   ├── agent/     # AI agent demo page
│   │   │   ├── products/  # Product pages
│   │   │   └── cart/      # Shopping cart
│   │   └── admin/         # Admin dashboard
│   └── (server)/          # Server-side API
│       └── api/v1/
│           ├── agent/     # Agent endpoints
│           ├── products/  # Product endpoints
│           └── auth/      # Authentication
├── components/
│   ├── agent/             # AI agent components
│   ├── products/          # Product components
│   ├── header/            # Header component
│   └── footer/            # Footer component
├── lib/
│   ├── agent/             # Agent services
│   │   ├── agentService.ts
│   │   ├── contextManager.ts
│   │   ├── semanticSearch.ts
│   │   └── promptBuilder.ts
│   ├── db.ts              # Database connection
│   └── api.ts             # API utilities
├── models/                # MongoDB models
│   ├── Product.ts
│   ├── Category.ts
│   ├── User.ts
│   └── Conversation.ts
└── types/                 # TypeScript types
    ├── agent.d.ts
    └── global.d.ts
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, SCSS Modules, Ant Design
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Next-Auth, Clerk
- **Search**: Fuse.js
- **Animation**: Framer Motion
- **Storage**: Google Cloud Storage

## AI Agent Features

### Natural Language Understanding
- Intent recognition
- Entity extraction
- Context-aware responses

### Semantic Search
- Fuzzy matching
- Relevance scoring
- Multi-type search (products, categories, docs)

### Conversation Management
- History tracking
- Context compression
- Memory retention

### Business Intelligence
- Product recommendations
- Analytics insights
- Performance metrics

## API Documentation

### Agent Endpoints

```typescript
// Send message
POST /api/v1/agent/chat
Body: { message, conversationId?, userId? }

// Get conversation history
GET /api/v1/agent/chat?conversationId=xxx

// Semantic search
POST /api/v1/agent/search
Body: { query, limit?, type? }

// Get agent config
GET /api/v1/agent/config
```

### Product Endpoints

```typescript
// Get all products
GET /api/v1/products

// Get product by slug
GET /api/v1/products/:slug

// Create product (admin)
POST /api/v1/product/create

// Update product (admin)
PUT /api/v1/product/update/:id

// Delete product (admin)
DELETE /api/v1/product/delete/:id
```

## Usage Examples

### Using the Agent

```tsx
import { AgentChat } from "@/components/agent";

export default function MyPage() {
  return <AgentChat userId="user-123" />;
}
```

### API Call

```typescript
const response = await fetch('/api/v1/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me modern sofas'
  })
});
const data = await response.json();
```

## Security

✅ CodeQL analysis: 0 vulnerabilities  
✅ Type-safe with TypeScript  
✅ MongoDB injection prevention  
✅ Secure authentication  

See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for details.

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Project Documentation
- [Agent Quick Start](AGENT_QUICK_START.md)
- [Agent Documentation](AGENT_DOCUMENTATION.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Please read the documentation and ensure:
- Code passes linting (`npm run lint`)
- TypeScript compiles without errors
- Security best practices are followed

## License

All rights reserved.

