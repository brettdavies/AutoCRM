
title: "Architecture Details"
version: "1.0.0"
last_updated: "2025-01-20"
---

# Architecture Details

## Table of Contents
- [Architecture Details](#architecture-details)
  - [Table of Contents](#table-of-contents)
  - [Architecture Overview](#architecture-overview)
    - [System Components](#system-components)
    - [Key Design Decisions](#key-design-decisions)
  - [Technology Stack](#technology-stack)
    - [Frontend Stack](#frontend-stack)
    - [Backend Stack](#backend-stack)
    - [Database \& Storage](#database--storage)
    - [Database Architecture](#database-architecture)
    - [Storage Architecture](#storage-architecture)
    - [AI Integration](#ai-integration)
  - [Data Flow](#data-flow)
    - [Ticket Lifecycle](#ticket-lifecycle)
    - [AI Processing Pipeline](#ai-processing-pipeline)
    - [Real-time Updates](#real-time-updates)
  - [Key Components](#key-components)
    - [Ticket Management System](#ticket-management-system)
    - [AI Agent System](#ai-agent-system)
    - [Customer Portal](#customer-portal)
    - [Agent Interface](#agent-interface)
  - [Communication Patterns](#communication-patterns)
    - [Real-time Events](#real-time-events)
    - [Message Queue](#message-queue)
    - [API Endpoints](#api-endpoints)
    - [Email Architecture](#email-architecture)
  - [Scalability \& Performance](#scalability--performance)
    - [Database Optimization](#database-optimization)
    - [Caching Strategy](#caching-strategy)
    - [Load Balancing](#load-balancing)
  - [Security Architecture](#security-architecture)
    - [Authentication](#authentication)
    - [Authorization](#authorization)
    - [Data Protection](#data-protection)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Feature Flags](#feature-flags)
  - [References to Other Docs](#references-to-other-docs)
    - [Email Architecture](#email-architecture-1)
    - [Integration Points](#integration-points)
    - [Email Templates](#email-templates)

## Architecture Overview

### System Components

AutoCRM is built as a modern, AI-enhanced customer support platform with these core components:

1. **Web Application**:
   - React-based SPA for customers and agents
   - Real-time updates via Supabase Realtime
   - Responsive design for all devices

2. **Backend Services**:
   - Supabase Edge Functions for API endpoints
   - Node.js services for AI processing
   - Python workers for ML tasks

3. **Database Layer**:
   - PostgreSQL with Supabase
   - Vector storage for AI embeddings
   - Real-time subscriptions

4. **AI Integration**:
   - RAG-based response generation
   - Ticket classification and routing
   - Knowledge base vectorization

### Key Design Decisions

1. **Supabase Platform**:
   - Provides real-time capabilities
   - Handles auth and row-level security
   - Offers vector storage for AI

2. **Edge Computing**:
   - Edge Functions for low-latency responses
   - Global distribution via Supabase
   - Reduced backend complexity

3. **AI Architecture**:
   - Hybrid approach using RAG
   - Continuous learning system
   - Human-in-the-loop feedback

## Technology Stack

### Frontend Stack

```typescript
// Tech Stack
const frontendStack = {
  framework: 'React 18+',
  stateManagement: 'Redux Toolkit',
  styling: 'TailwindCSS',
  realtime: 'Supabase Realtime',
  apiClient: 'supabase-js'
};
```

### Backend Stack

```typescript
// Tech Stack
const backendStack = {
  primary: 'Supabase Platform',
  database: 'PostgreSQL 15+',
  auth: 'Supabase Auth',
  functions: 'Supabase Edge Functions',
  runtime: 'Deno',
  aiProcessing: 'Python 3.9+',
  queue: 'Redis',
  email: 'Resend'
};

// Communication Patterns
const communicationPatterns = {
  database: 'PostgreSQL + PostgREST',
  realtime: 'Supabase Realtime',
  email: {
    provider: 'Resend',
    integration: 'Edge Functions',
    templates: 'React Email'
  },
  events: 'Database Change Events'
};
```

### Database & Storage

### Database Architecture

AutoCRM uses Supabase PostgreSQL for its primary database, leveraging its powerful features:

1. **Core Database Features**:
   - PostgreSQL 15+ with extensions:

     ```sql
     -- See db/schema/00_extensions.sql for complete list
     uuid-ossp   -- UUID generation
     vector      -- Vector operations for AI
     pg_trgm     -- Fuzzy text search
     pg_graphql  -- GraphQL API
     pgjwt       -- JWT handling
     ```

   - Row Level Security (RLS) for fine-grained access control
   - Real-time subscriptions via Postgres changes
   - Full-text search capabilities
   - Vector similarity search for AI features

2. **Schema Organization**:

   ```plaintext
   db/
   ├── schema/              # Core schema definitions
   │   ├── 00_extensions.sql    # PostgreSQL extensions
   │   ├── 01_users.sql        # User accounts
   │   ├── 02_teams.sql        # Team management
   │   ├── 03_tickets.sql      # Ticket system
   │   ├── 04_conversations.sql # Messages
   │   ├── 05_knowledge_base.sql # KB articles
   │   └── 06_ai_components.sql  # AI data
   ├── migrations/         # Database migrations
   │   └── YYYYMMDDHHMMSS_*.sql
   └── seeds/             # Test data
       └── initial_data.sql
   ```

3. **Key Tables & Relationships**:
   - Users & Authentication ([01_users.sql](../db/schema/01_users.sql))
     - Customer accounts
     - Agent profiles
     - Admin users
     - Team memberships
   
   - Team Management ([02_teams.sql](../db/schema/02_teams.sql))
     - Team definitions
     - Skill tracking
     - Routing rules
     - Performance metrics

   - Ticket System ([03_tickets.sql](../db/schema/03_tickets.sql))
     - Support tickets
     - Status tracking
     - Priority management
     - SLA monitoring
   
   - Conversations ([04_conversations.sql](../db/schema/04_conversations.sql))
     - Message history
     - AI responses
     - System notifications
     - Attachments

   - Knowledge Base ([05_knowledge_base.sql](../db/schema/05_knowledge_base.sql))
     - Articles
     - Categories
     - Vector embeddings
     - User feedback

   - AI Components ([06_ai_components.sql](../db/schema/06_ai_components.sql))
     - Response tracking
     - Learning data
     - Performance metrics
     - Feedback collection

4. **Security Model**:

   ```sql
   -- Example RLS policies (see individual schema files for complete policies)
   
   -- Tickets visibility
   CREATE POLICY "Users can view own tickets"
   ON tickets FOR SELECT
   USING (auth.uid() = customer_id);

   CREATE POLICY "Agents can view team tickets"
   ON tickets FOR SELECT
   USING (
     auth.uid() IN (
       SELECT user_id FROM team_members
       WHERE team_id = tickets.team_id
     )
   );

   -- Team access
   CREATE POLICY "Team members can view team data"
   ON teams FOR SELECT
   USING (
     auth.uid() IN (
       SELECT user_id FROM team_members
       WHERE team_id IN (
         SELECT team_id FROM tickets
         WHERE id = (storage.foldername(name))[1]
       )
     )
   );
   ```

5. **Performance Optimization**:

   ```sql
   -- Key indexes (see individual schema files for complete index definitions)
   
   -- Ticket lookups
   CREATE INDEX idx_tickets_customer ON tickets(customer_id);
   CREATE INDEX idx_tickets_team ON tickets(team_id);
   CREATE INDEX idx_tickets_status ON tickets(status);
   
   -- Conversation access
   CREATE INDEX idx_conversations_ticket ON conversations(ticket_id);
   
   -- Knowledge base search
   CREATE INDEX idx_articles_embedding ON articles 
   USING ivfflat (embedding vector_cosine_ops);
   ```

6. **Backup & Recovery**:
   - Daily automated backups
   - Point-in-time recovery (PITR)
   - Backup retention: 30 days
   - Recovery testing monthly

### Storage Architecture

1. **File Storage**:
   - Supabase Storage for file attachments
   - Bucket organization:

     ```plaintext
     storage/
     ├── attachments/       # Ticket attachments
     │   ├── {ticket_id}/   # Per-ticket files
     │   └── temp/          # Temporary uploads
     ├── avatars/          # User avatars
     └── kb_assets/        # Knowledge base assets
     ```

2. **Storage Policies**:

   ```sql
   -- Example storage policies
   CREATE POLICY "Public avatars access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   CREATE POLICY "Ticket attachment access"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'attachments' AND
     (auth.uid() IN (
       SELECT customer_id FROM tickets
       WHERE id = (storage.foldername(name))[1]
     ) OR
     auth.uid() IN (
       SELECT user_id FROM team_members
       WHERE team_id IN (
         SELECT team_id FROM tickets
         WHERE id = (storage.foldername(name))[1]
       )
     ))
   );
   ```

3. **File Handling**:
   - Maximum file size: 50MB
   - Supported formats:
     - Images: jpg, png, gif, webp
     - Documents: pdf, doc, docx, txt
     - Archives: zip
   - Virus scanning on upload
   - Automatic image optimization

### AI Integration

```python
# AI Component Architecture
class AIProcessor:
    def process_ticket(self, ticket: Ticket) -> AIResponse:
        # 1. Extract context
        context = self.knowledge_base.search(ticket.content)
        
        # 2. Generate response
        response = self.llm.generate(
            prompt=ticket.content,
            context=context,
            style=self.get_style_guide()
        )
        
        # 3. Store feedback
        self.store_learning_data(ticket, response)
        
        return response
```

## Data Flow

### Ticket Lifecycle

1. **Creation Flow**:

   ```mermaid
   graph LR
   A[Customer] --> B[Web UI]
   B --> C[Edge Function]
   C --> D[Database]
   D --> E[AI Analysis]
   E --> F[Agent Assignment]
   ```

2. **Update Flow**:

   ```mermaid
   graph LR
   A[Update] --> B[Edge Function]
   B --> C[Database]
   C --> D[Real-time Events]
   D --> E[UI Updates]
   ```

### AI Processing Pipeline

1. **Response Generation**:
   - Query vectorization
   - Knowledge base search
   - Context assembly
   - Response generation
   - Quality check

2. **Learning System**:
   - Feedback collection
   - Model fine-tuning
   - Performance tracking

### Real-time Updates

Implemented using Supabase Realtime:

```typescript
// Real-time subscription
const subscription = supabase
  .channel('tickets')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tickets'
  }, payload => {
    updateUI(payload.new)
  })
  .subscribe()
```

## Key Components

### Ticket Management System

Core ticket processing flow:

```typescript
interface TicketProcessor {
  // Create new ticket
  create(data: TicketData): Promise<Ticket>
  
  // Update existing ticket
  update(id: string, data: Partial<TicketData>): Promise<Ticket>
  
  // Process ticket with AI
  processWithAI(ticket: Ticket): Promise<AIResponse>
  
  // Route ticket to appropriate team
  route(ticket: Ticket): Promise<Assignment>
}
```

### AI Agent System

AI processing pipeline:

```python
class AIAgent:
    def __init__(self):
        self.vectorstore = Vectorstore()
        self.llm = LanguageModel()
        self.router = TicketRouter()
    
    async def process_ticket(self, ticket: Ticket):
        # 1. Analyze content
        analysis = await self.analyze_content(ticket)
        
        # 2. Generate response
        response = await self.generate_response(analysis)
        
        # 3. Route ticket
        assignment = await self.route_ticket(analysis)
        
        return TicketProcessingResult(
            analysis=analysis,
            response=response,
            assignment=assignment
        )
```

### Customer Portal

Features and components:

```typescript
interface CustomerPortal {
  // Ticket management
  tickets: {
    create: (data: TicketData) => Promise<Ticket>
    list: () => Promise<Ticket[]>
    update: (id: string, data: Partial<TicketData>) => Promise<Ticket>
  }
  
  // Knowledge base
  kb: {
    search: (query: string) => Promise<Article[]>
    suggest: (context: string) => Promise<Article[]>
  }
  
  // Chat interface
  chat: {
    sendMessage: (message: Message) => Promise<void>
    getHistory: (ticketId: string) => Promise<Message[]>
  }
}
```

### Agent Interface

Agent workspace components:

```typescript
interface AgentWorkspace {
  // Queue management
  queue: {
    getNext: () => Promise<Ticket>
    assign: (ticketId: string, agentId: string) => Promise<void>
  }
  
  // Response tools
  responses: {
    getTemplates: () => Promise<Template[]>
    getSuggestions: (context: string) => Promise<Suggestion[]>
  }
  
  // Performance tracking
  metrics: {
    getStats: (agentId: string) => Promise<AgentStats>
    trackResolution: (ticketId: string) => Promise<void>
  }
}
```

## Communication Patterns

### Real-time Events

Event types and channels:

```typescript
// Event types
type RealtimeEvent =
  | TicketCreated
  | TicketUpdated
  | MessageReceived
  | AgentAssigned
  | StatusChanged;

// Channel configuration
const channels = {
  tickets: 'public:tickets',
  messages: 'public:conversations',
  agents: 'private:agents'
};
```

### Message Queue

Redis-based queue system:

```typescript
interface QueueSystem {
  // High-priority operations
  ticketQueue: Queue<Ticket>
  
  // Background operations
  aiProcessingQueue: Queue<AITask>
  notificationQueue: Queue<Notification>
  
  // Dead letter queue
  dlq: Queue<FailedTask>
}
```

### API Endpoints

RESTful API structure:

```typescript
const apiEndpoints = {
  tickets: {
    create: 'POST /api/tickets',
    update: 'PUT /api/tickets/:id',
    list: 'GET /api/tickets',
    delete: 'DELETE /api/tickets/:id'
  },
  conversations: {
    create: 'POST /api/conversations',
    list: 'GET /api/conversations/:ticketId'
  },
  ai: {
    analyze: 'POST /api/ai/analyze',
    suggest: 'POST /api/ai/suggest'
  }
};
```

### Email Architecture

1. **Email Provider Integration**:

   ```typescript
   // Email handling in Edge Functions
   async function sendEmail(options: EmailOptions) {
     const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
     
     const { data, error } = await resend.emails.send({
       from: 'support@autocrm.com',
       ...options,
       react: options.template ? await renderTemplate(options) : undefined
     });

     if (error) {
       console.error('Failed to send email:', error);
       throw error;
     }

     return data;
   }
   ```

2. **Email Templates**:

   ```typescript
   // React Email template system
   import { 
     Html, 
     Head, 
     Body, 
     Container,
     Section,
     Text 
   } from '@react-email/components';

   interface TemplateProps {
     ticket: Ticket;
     customer: User;
     agent?: User;
   }

   export function TicketUpdateEmail({ ticket, customer, agent }: TemplateProps) {
     return (
       <Html>
         <Head />
         <Body>
           <Container>
             <Section>
               <Text>Hi {customer.name},</Text>
               <Text>Your ticket #{ticket.id} has been updated</Text>
               {agent && (
                 <Text>
                   {agent.name} from our support team has responded to your ticket
                 </Text>
               )}
               <Text>Status: {ticket.status}</Text>
               <Text>Latest Update: {ticket.latest_response}</Text>
             </Section>
           </Container>
         </Body>
       </Html>
     );
   }
   ```

3. **Email Triggers**:

   ```typescript
   // Email notification system
   interface EmailTrigger {
     event: 'ticket.created' | 'ticket.updated' | 'ticket.resolved';
     recipients: {
       to: string[];
       cc?: string[];
       bcc?: string[];
     };
     template: string;
     data: Record<string, any>;
   }

   async function handleEmailTrigger(trigger: EmailTrigger) {
     const template = await loadTemplate(trigger.template);
     
     await sendEmail({
       to: trigger.recipients.to,
       cc: trigger.recipients.cc,
       bcc: trigger.recipients.bcc,
       subject: getSubjectForEvent(trigger.event),
       template,
       data: trigger.data
     });

     await supabase
       .from('notifications')
       .insert({
         type: 'email',
         event: trigger.event,
         metadata: {
           recipients: trigger.recipients,
           template: trigger.template
         }
       });
   }
   ```

4. **Email Processing**:

   ```typescript
   // Email processing pipeline
   async function processIncomingEmail(email: IncomingEmail) {
     // 1. Extract ticket information
     const ticketId = extractTicketId(email.subject);
     const content = cleanEmailContent(email.body);
     
     // 2. Create or update ticket
     if (ticketId) {
       await updateExistingTicket(ticketId, content);
     } else {
       await createNewTicket({
         customer_email: email.from,
         subject: email.subject,
         content
       });
     }
     
     // 3. Send confirmation
     await sendEmailConfirmation(email.from, ticketId);
   }
   ```

5. **Email Analytics**:

   ```typescript
   // Email tracking and analytics
   interface EmailAnalytics {
     trackDelivery(emailId: string): Promise<void>;
     trackOpen(emailId: string): Promise<void>;
     trackClick(emailId: string, link: string): Promise<void>;
     getStats(timeframe: TimeFrame): Promise<EmailStats>;
   }

   const emailAnalytics: EmailAnalytics = {
     async trackDelivery(emailId) {
       await supabase
         .from('email_events')
         .insert({
           email_id: emailId,
           event: 'delivered',
           timestamp: new Date()
         });
     },
     // ... other implementations
   };
   ```

## Scalability & Performance

### Database Optimization

Key optimization strategies:

1. **Indexing**:

   ```sql
   -- Optimize ticket queries
   CREATE INDEX idx_tickets_status_priority 
   ON tickets(status, priority);
   
   -- Optimize conversation queries
   CREATE INDEX idx_conversations_ticket_created 
   ON conversations(ticket_id, created_at);
   ```

2. **Partitioning**:

   ```sql
   -- Partition conversations by month
   CREATE TABLE conversations (
     id UUID,
     created_at TIMESTAMPTZ
   ) PARTITION BY RANGE (created_at);
   ```

### Caching Strategy

Multi-level caching:

```typescript
interface CacheStrategy {
  // Application cache
  memory: {
    type: 'memory'
    ttl: 300 // 5 minutes
  }
  
  // Distributed cache
  redis: {
    type: 'redis'
    ttl: 3600 // 1 hour
  }
  
  // CDN cache
  cdn: {
    type: 'cloudflare'
    ttl: 86400 // 1 day
  }
}
```

### Load Balancing

Distribution strategy:

```typescript
interface LoadBalancer {
  // Round-robin for Edge Functions
  edgeFunctions: {
    strategy: 'round-robin'
    healthCheck: '/health'
  }
  
  // Least connections for AI processing
  aiProcessing: {
    strategy: 'least-connections'
    healthCheck: '/ai/health'
  }
}
```

## Security Architecture

### Authentication

Auth configuration:

```typescript
const authConfig = {
  providers: ['email', 'google', 'github'],
  session: {
    expiry: '7d',
    refreshToken: true
  },
  mfa: {
    enabled: true,
    methods: ['totp', 'sms']
  }
};
```

### Authorization

Row-level security policies:

```sql
-- Ticket access policy
CREATE POLICY "Users can view own tickets"
ON tickets
FOR SELECT
USING (
  auth.uid() = customer_id
  OR auth.uid() IN (
    SELECT user_id FROM agents
    WHERE team_id = tickets.team_id
  )
);
```

### Data Protection

Encryption and privacy:

```typescript
interface DataProtection {
  // At-rest encryption
  storage: {
    type: 'aes-256-gcm',
    keyRotation: '90d'
  }
  
  // In-transit encryption
  transport: {
    type: 'tls-1.3',
    minimumVersion: 'TLSv1.2'
  }
}
```

## Configuration

### Environment Variables

Required configuration:

```bash
# Database
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_KEY="your-key"

# AI Services
OPENAI_API_KEY="sk-..."
PINECONE_API_KEY="your-key"

# Authentication
AUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-id"
GITHUB_CLIENT_ID="your-id"

# Infrastructure
REDIS_URL="redis://..."
AWS_ACCESS_KEY="your-key"
```

### Feature Flags

Feature management:

```typescript
interface FeatureFlags {
  aiResponses: boolean
  vectorSearch: boolean
  realtimeChat: boolean
  multiLanguage: boolean
  betaFeatures: {
    voiceSupport: boolean
    videoChat: boolean
  }
}
```

## References to Other Docs

- For database schema details, see [Data Model & Schema](./data_model_and_schema.md)
- For development setup, see [Dev Workflow](./dev_workflow.md)
- For feature documentation, see [Usage and Features](./usage_and_features.md)
- For testing guidelines, see [Dev Workflow](./dev_workflow.md#testing-strategy)

### Email Architecture

```typescript
// Email handling in Edge Functions
async function sendTicketNotification(ticket: Ticket) {
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  const { data, error } = await resend.emails.send({
    from: 'support@autocrm.com',
    to: ticket.customer.email,
    subject: `Ticket #${ticket.id} Update`,
    react: <TicketUpdateEmail ticket={ticket} />
  });

  if (error) {
    console.error('Failed to send email:', error);
    return;
  }

  await supabase
    .from('notifications')
    .insert({
      ticket_id: ticket.id,
      type: 'email',
      status: 'sent',
      metadata: { email_id: data.id }
    });
}
```

### Integration Points

```typescript
// Example Edge Function for ticket updates
serve(async (req) => {
  // Handle ticket update
  const { data: ticket, error } = await supabase
    .from('tickets')
    .update(ticketData)
    .eq('id', ticketId)
    .select()
    .single();
    
  if (error) return new Response(error.message, { status: 500 });
  
  // Send email notification via Resend
  await sendTicketNotification(ticket);
  
  return new Response(JSON.stringify(ticket), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Email Templates

```typescript
// React Email template example
import { 
  Html, 
  Head, 
  Body, 
  Container,
  Section,
  Text 
} from '@react-email/components';

export function TicketUpdateEmail({ ticket }: { ticket: Ticket }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Section>
            <Text>Ticket #{ticket.id} has been updated</Text>
            <Text>Status: {ticket.status}</Text>
            <Text>Latest Update: {ticket.latest_response}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
``` 