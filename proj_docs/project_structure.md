---
title: "Project Structure"
version: "1.0.0"
last_updated: "2025-01-20"
---

# Project Structure: AutoCRM

This document describes the organization of the AutoCRM codebase. It provides an overview of the directory structure, naming conventions, and best practices for maintaining a scalable and maintainable AI-enhanced customer support platform.

## Directory Structure

```plaintext
AutoCRM/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── tickets/       # Ticket management
│   │   │   │   ├── TicketList.tsx
│   │   │   │   ├── TicketDetail.tsx
│   │   │   │   └── CreateTicket.tsx
│   │   │   ├── ai/           # AI-related components
│   │   │   │   ├── AIResponse.tsx
│   │   │   │   └── FeedbackForm.tsx
│   │   │   ├── kb/           # Knowledge base
│   │   │   │   ├── ArticleList.tsx
│   │   │   │   └── ArticleEditor.tsx
│   │   │   ├── teams/        # Team management
│   │   │   │   ├── TeamList.tsx
│   │   │   │   └── TeamConfig.tsx
│   │   │   ├── ui/           # Shared UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Modal.tsx
│   │   │   └── layout/       # Layout components
│   │   ├── stores/           # State management
│   │   │   ├── ticket-store.ts
│   │   │   └── ai-store.ts
│   │   ├── types/            # TypeScript types
│   │   │   ├── ticket.ts
│   │   │   └── ai.ts
│   │   ├── lib/              # Shared utilities
│   │   │   └── api.ts
│   │   ├── hooks/            # Custom React hooks
│   │   └── assets/           # Static assets
│   ├── public/               # Public static files
│   ├── tests/                # Test setup and mocks
│   ├── index.html            # Entry HTML file
│   ├── vite.config.ts        # Vite configuration
│   └── package.json          # Frontend dependencies
│
├── server/                    # Backend services
│   ├── src/
│   │   ├── api/             # Edge Function handlers
│   │   │   ├── tickets/
│   │   │   ├── teams/
│   │   │   └── ai/
│   │   ├── services/        # Business logic
│   │   │   ├── ticket-service.ts
│   │   │   ├── ai-service.ts
│   │   │   └── team-service.ts
│   │   ├── middleware/      # Edge Function middleware
│   │   │   ├── auth.ts
│   │   │   └── rate-limit.ts
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── tests/              # Test files
│   └── package.json        # Backend dependencies
│
├── ai/                      # AI processing services
│   ├── src/
│   │   ├── agents/         # AI agent implementations
│   │   │   ├── ticket-agent.py
│   │   │   └── response-agent.py
│   │   ├── models/         # ML model definitions
│   │   │   ├── classifier.py
│   │   │   └── embeddings.py
│   │   ├── utils/          # AI utilities
│   │   │   ├── vector_store.py
│   │   │   └── prompt_templates.py
│   │   └── services/       # AI services
│   │       ├── rag_service.py
│   │       └── feedback_service.py
│   ├── tests/              # AI component tests
│   └── requirements.txt    # Python dependencies
│
├── db/                      # Database management
│   ├── schema/             # Schema definitions
│   │   ├── 00_extensions.sql
│   │   ├── 01_users.sql
│   │   ├── 02_teams.sql
│   │   ├── 03_tickets.sql
│   │   ├── 04_conversations.sql
│   │   ├── 05_knowledge_base.sql
│   │   └── 06_ai_components.sql
│   ├── migrations/         # Database migrations
│   │   ├── YYYYMMDD_initial.sql
│   │   └── YYYYMMDD_feature_x.sql
│   ├── seeds/             # Seed data
│   └── scripts/           # Database utilities
│
├── templates/              # Project documentation
│   ├── project_overview.md
│   ├── architecture_details.md
│   ├── data_model_and_schema.md
│   ├── dev_workflow.md
│   └── usage_and_features.md
│
├── .github/               # GitHub configuration
│   └── workflows/         # CI/CD workflows
│
├── .vscode/              # VS Code configuration
├── .env.example          # Environment template
├── docker-compose.yml    # Docker configuration
├── package.json          # Root package.json
└── README.md            # Project overview
```

## Package Overview

### Frontend Package (`client/`)

The frontend implements the customer portal, agent workspace, and admin dashboard:

1. **Components (`src/components/`)**:
   - Domain-based organization (tickets, ai, kb, teams)
   - Shared UI components in `ui/`
   - Feature-specific components in respective folders
   - Strict separation of concerns

2. **State Management (`src/stores/`)**:

   ```typescript
   // Example ticket store
   interface TicketStore {
     tickets: Ticket[]
     activeTicket: Ticket | null
     aiSuggestions: AISuggestion[]
     
     createTicket: (data: CreateTicketInput) => Promise<void>
     updateTicket: (id: string, data: UpdateTicketInput) => Promise<void>
     getAISuggestions: (ticketId: string) => Promise<void>
   }
   ```

3. **API Integration (`src/lib/`)**:

   ```typescript
   // Example API client
   const api = {
     tickets: {
       create: (data: CreateTicketInput) => post('/tickets', data),
       update: (id: string, data: UpdateTicketInput) => put(`/tickets/${id}`, data),
       getAISuggestions: (id: string) => get(`/ai/suggestions/${id}`)
     }
   }
   ```

### Backend Package (`server/`)

Supabase Edge Functions and integrations:

1. **Edge Functions (`supabase/functions/`)**:

   ```typescript
   // Example ticket handler in supabase/functions/create-ticket/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { createClient } from '@supabase/supabase-js'
   
   serve(async (req) => {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? ''
     )

     const { data, error } = await validateTicketInput(req.body)
     if (error) return new Response(error, { status: 400 })
     
     const { data: ticket, error: dbError } = await supabase
       .from('tickets')
       .insert(data)
       .select()
       .single()
     
     if (dbError) return new Response(dbError.message, { status: 500 })
     await aiService.analyzeTicket(ticket.id)
     return new Response(JSON.stringify(ticket), { status: 201 })
   })
   ```

2. **Edge Function Organization**:

   ```plaintext
   supabase/
   ├── functions/
   │   ├── create-ticket/
   │   │   ├── index.ts
   │   │   └── README.md
   │   ├── update-ticket/
   │   │   ├── index.ts
   │   │   └── README.md
   │   └── shared/
   │       ├── supabase.ts
   │       └── validation.ts
   ```

3. **Real-time Subscriptions (`src/subscriptions/`)**:

   ```typescript
   // ticket-subscriptions.ts
   export function setupTicketSubscriptions() {
     supabase
       .channel('tickets')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'tickets' },
         (payload) => handleTicketChange(payload)
       )
       .subscribe()
   }
   ```

### AI Package (`ai/`)

Python-based AI processing:

1. **Agents (`src/agents/`)**:

   ```python
   class TicketAgent:
       def __init__(self):
           self.classifier = TicketClassifier()
           self.vectorstore = VectorStore()
           
       async def process_ticket(self, ticket: Ticket) -> AIResponse:
           classification = self.classifier.classify(ticket.content)
           context = self.vectorstore.search(ticket.content)
           return self.generate_response(classification, context)
   ```

2. **Services (`src/services/`)**:

   ```python
   class RAGService:
       def __init__(self):
           self.embeddings = SentenceTransformer()
           self.llm = OpenAI()
           
       def generate_response(self, query: str, context: List[str]) -> str:
           prompt = self.create_prompt(query, context)
           return self.llm.generate(prompt)
   ```

## File Naming Conventions

1. **Components**:
   - PascalCase for component files
   - Example: `TicketDetail.tsx`, `AIResponse.tsx`

2. **Services/Utils**:
   - camelCase for service/utility files
   - Example: `ticketService.ts`, `vectorStore.py`

3. **Database**:
   - snake_case for SQL files
   - Numbered prefix for ordering
   - Example: `01_users.sql`, `02_teams.sql`

4. **Tests**:
   - Match source file name with `.test` suffix
   - Example: `TicketDetail.test.tsx`, `ticketService.test.ts`

## Component Organization

Components are organized by domain and responsibility:

```plaintext
components/
├── tickets/              # Ticket management
│   ├── TicketList.tsx   # List of tickets
│   ├── TicketDetail.tsx # Single ticket view
│   └── CreateTicket.tsx # Ticket creation form
├── ai/                  # AI-related components
│   ├── AIResponse.tsx   # AI response display
│   └── FeedbackForm.tsx # AI feedback collection
├── kb/                  # Knowledge base
│   ├── ArticleList.tsx  # Article listing
│   └── ArticleEditor.tsx # Article editing
└── ui/                  # Shared UI components
    ├── Button.tsx
    └── Modal.tsx
```

## Best Practices

### 1. Code Organization

- One component/class per file
- Clear file/directory structure
- Consistent naming conventions
- Proper type definitions

### 2. AI Integration

```typescript
// Example AI integration pattern
interface AIProcessor {
  // Analyze ticket content
  analyzeTicket(content: string): Promise<TicketAnalysis>
  
  // Generate response suggestions
  generateSuggestions(context: TicketContext): Promise<AISuggestion[]>
  
  // Process feedback
  processFeedback(feedback: AIFeedback): Promise<void>
}
```

### 3. Testing Strategy

1. **Frontend Tests**:

   ```typescript
   describe('TicketDetail', () => {
     it('displays AI suggestions when available', async () => {
       const ticket = mockTicket()
       const suggestions = mockAISuggestions()
       
       render(<TicketDetail ticket={ticket} suggestions={suggestions} />)
       
       expect(screen.getByText(suggestions[0].content)).toBeInTheDocument()
     })
   })
   ```

2. **AI Component Tests**:

   ```python
   def test_rag_response_generation():
       service = RAGService()
       query = "How do I reset my password?"
       context = ["Password reset instructions..."]
       
       response = service.generate_response(query, context)
       
       assert len(response) > 0
       assert response.confidence > 0.8
   ```

### 4. Database Practices

1. **Schema Organization**:
   - Numbered files for dependency order
   - Clear table/column comments
   - Proper indexing strategy

2. **Migration Strategy**:
   - Timestamped migration files
   - Up/down migration pairs
   - Transaction wrapping

## Development Workflow

1. **Local Development**:

   ```bash
   # Start Supabase local development
   supabase start
   
   # Start Edge Functions locally
   supabase functions serve
   
   # Start frontend
   cd client && npm run dev
   
   # Start AI service
   cd ai && python -m uvicorn main:app --reload
   ```

2. **Edge Function Development**:

   ```bash
   # Create new Edge Function
   supabase functions new my-function
   
   # Test locally with environment variables
   supabase functions serve --env-file .env.local
   
   # Deploy to Supabase
   supabase functions deploy my-function --project-ref your-project-ref
   ```

## References to Other Docs

- For architectural details, see [Architecture Details](./architecture_details.md)
- For database schema, see [Data Model & Schema](./data_model_and_schema.md)
- For development workflow, see [Dev Workflow](./dev_workflow.md)
- For feature documentation, see [Usage and Features](./usage_and_features.md)

## Database Package

The `db/` directory contains all database-related code and configuration. For detailed implementation, see [Database Architecture](architecture_details.md#database-architecture).

```plaintext
db/
├── schema/                 # Core schema definitions
│   ├── 00_extensions.sql  # PostgreSQL extensions
│   ├── 01_users.sql      # User accounts & auth
│   ├── 02_teams.sql      # Team management
│   ├── 03_tickets.sql    # Ticket system
│   ├── 04_conversations.sql # Message history
│   ├── 05_knowledge_base.sql # KB articles
│   └── 06_ai_components.sql # AI data
├── migrations/            # Database migrations
│   └── YYYYMMDDHHMMSS_*.sql
├── seeds/                # Test data
│   └── initial_data.sql
└── supabase/            # Supabase configuration
    ├── config.toml      # Project settings
    └── functions/       # Edge Functions
        ├── create-ticket/
        ├── update-ticket/
        └── shared/
```

### Schema Organization

1. **Core Schema Files**:
   - `00_extensions.sql`: Required PostgreSQL extensions
   - `01_users.sql`: User management system
   - `02_teams.sql`: Team organization
   - `03_tickets.sql`: Ticket tracking
   - `04_conversations.sql`: Message handling
   - `05_knowledge_base.sql`: Knowledge management
   - `06_ai_components.sql`: AI functionality

   For detailed schema definitions, see [Data Model & Schema](data_model_and_schema.md#schema-definitions).

2. **Migration Strategy**:

   ```plaintext
   migrations/
   ├── 20240110000000_initial_schema.sql
   ├── 20240110000001_add_team_features.sql
   ├── 20240110000002_enhance_tickets.sql
   └── 20240110000003_ai_components.sql
   ```

   For migration guidelines, see [Migration Strategy](data_model_and_schema.md#migration-strategy).

3. **Seed Data**:

   ```plaintext
   seeds/
   ├── initial_data.sql    # Base test data
   ├── demo_tickets.sql    # Sample tickets
   └── kb_articles.sql     # Example KB content
   ```

### Edge Functions

Supabase Edge Functions for database operations:

```plaintext
supabase/functions/
├── create-ticket/
│   ├── index.ts          # Ticket creation
│   └── schema.ts         # Input validation
├── update-ticket/
│   ├── index.ts          # Status updates
│   └── schema.ts         # Update validation
└── shared/
    ├── db.ts             # Database helpers
    ├── auth.ts           # Auth utilities
    └── types.ts          # Common types
```

For Edge Function implementation details, see [Edge Computing](architecture_details.md#edge-computing).

### Best Practices

1. **Schema Management**:
   - Keep schema files focused and modular
   - Document all tables and relationships
   - Include indexes for common queries
   - Implement RLS policies for security

2. **Migration Guidelines**:
   - One change per migration
   - Include both up and down migrations
   - Test migrations in staging first
   - Document breaking changes

3. **Edge Functions**:
   - Validate all inputs
   - Handle errors gracefully
   - Use TypeScript for type safety
   - Share common utilities

4. **Testing Strategy**:
   - Unit tests for Edge Functions
   - Integration tests for migrations
   - Seed data for testing
   - Regular backup testing

For detailed implementation guidelines, see [Development Workflow](dev_workflow.md#database-development). 