---
title: "Data Model & Schema"
version: "1.0.0"
last_updated: "2025-01-20"
---

# Data Model & Schema

## Table of Contents

- [Data Model \& Schema](#data-model--schema)
  - [Table of Contents](#table-of-contents)
  - [Data Model Summary](#data-model-summary)
  - [Core Entities](#core-entities)
  - [Entity Relationships](#entity-relationships)
  - [Schema Organization](#schema-organization)
  - [Schema Definitions](#schema-definitions)
  - [Migration Strategy](#migration-strategy)
  - [References](#references)

## Data Model Summary

AutoCRM's data model centers around tickets and their relationships:

- Tickets belong to customers and are assigned to teams/agents
- Conversations are linked to tickets, including human and AI responses
- Knowledge base articles are vectorized for AI retrieval
- Teams manage groups of agents with specific skill sets
- AI feedback and learning data is stored for continuous improvement

For implementation details, see [Database & Storage](architecture_details.md#database--storage).

## Core Entities

1. **Users & Teams**:
   - User accounts and authentication ([01_users.sql](../db/schema/01_users.sql))
   - Team management and organization ([02_teams.sql](../db/schema/02_teams.sql))
   - Key features:
     - Role-based access (customer, agent, admin)
     - Team assignments and skills
     - User preferences and metadata
     - Team routing rules

2. **Tickets & Conversations**:
   - Support ticket management ([03_tickets.sql](../db/schema/03_tickets.sql))
   - Message history and interactions ([04_conversations.sql](../db/schema/04_conversations.sql))
   - Key features:
     - Status and priority tracking
     - Team assignments
     - AI analysis metadata
     - SLA monitoring
     - Multi-type conversations (customer, agent, AI, system)

3. **Knowledge Base**:
   - Article management ([05_knowledge_base.sql](../db/schema/05_knowledge_base.sql))
   - Key features:
     - Vector embeddings for AI search
     - Categorization and tagging
     - User feedback collection
     - Publishing workflow

4. **AI Components**:
   - AI feedback and learning ([06_ai_components.sql](../db/schema/06_ai_components.sql))
   - Key features:
     - Response quality tracking
     - Learning data collection
     - Performance metrics
     - Continuous improvement data

## Entity Relationships

1. **Ticket Management**:

   ```mermaid
   graph TD
   A[User] -->|creates| B[Ticket]
   B -->|assigned to| C[Agent]
   B -->|belongs to| D[Team]
   B -->|has many| E[Conversations]
   B -->|tracked by| F[AI Feedback]
   ```

2. **Team Organization**:

   ```mermaid
   graph TD
   A[Team] -->|has many| B[Agents]
   A -->|has| C[Routing Rules]
   A -->|has| D[Skills]
   B -->|handle| E[Tickets]
   ```

3. **Knowledge Base**:

   ```mermaid
   graph TD
   A[Article] -->|written by| B[Author]
   A -->|has| C[Vector Embedding]
   A -->|receives| D[Feedback]
   A -->|used by| E[AI System]
   ```

## Schema Organization

Our schema follows Supabase best practices:

1. **File Structure**:

   ```plaintext
   db/
   ├── schema/
   │   ├── 00_extensions.sql    # PostgreSQL extensions
   │   ├── 01_users.sql        # User accounts
   │   ├── 02_teams.sql        # Team management
   │   ├── 03_tickets.sql      # Ticket system
   │   ├── 04_conversations.sql # Messages
   │   ├── 05_knowledge_base.sql # KB articles
   │   └── 06_ai_components.sql  # AI data
   ├── migrations/
   │   └── YYYYMMDDHHMMSS_*.sql # Migrations
   └── seeds/
       └── initial_data.sql    # Test data
   ```

2. **Extensions Setup**:
   - Required PostgreSQL extensions ([00_extensions.sql](../db/schema/00_extensions.sql))
   - Key extensions:
     - `uuid-ossp` for UUID generation
     - `vector` for AI embeddings
     - `pg_trgm` for fuzzy search
     - `pg_stat_statements` for query analysis

3. **Security Policies**:
   - Row Level Security (RLS) policies
   - Role-based access control
   - Team-based permissions
   - See individual schema files for specific policies

4. **Indexing Strategy**:
   - Primary key indexes (UUID)
   - Foreign key indexes
   - Status and priority indexes
   - Vector similarity indexes
   - See individual schema files for specific indexes

## Schema Definitions

1. **Custom Types**:
   - User roles and statuses
   - Ticket statuses and priorities
   - Message types
   - See individual schema files for complete definitions

2. **Functions & Triggers**:
   - Timestamp management
   - Vector similarity search
   - Notification handling
   - See individual schema files for implementations

3. **Views & Materialized Views**:
   - Ticket overviews
   - Team performance metrics
   - AI effectiveness tracking
   - See individual schema files for view definitions

## Migration Strategy

Database updates follow a strict process:

1. **Creating Migrations**:

   ```bash
   # Generate migration file
   supabase migration new add_feature_x

   # Migration template
   -- Migration: YYYYMMDDHHMMSS_add_feature_x.sql
   -- Up migration
   BEGIN;
   -- Add new tables/columns
   ALTER TABLE tickets ADD COLUMN priority ticket_priority;
   -- Add indexes/constraints
   CREATE INDEX idx_tickets_priority ON tickets(priority);
   COMMIT;

   -- Down migration
   BEGIN;
   DROP INDEX idx_tickets_priority;
   ALTER TABLE tickets DROP COLUMN priority;
   COMMIT;
   ```

2. **Testing Process**:

   ```bash
   # Reset local database
   supabase db reset

   # Run specific migration
   supabase db reset --linked
   ```

3. **Deployment Steps**:

   ```bash
   # Push to staging
   supabase db push --db-url=$STAGING_DB_URL

   # Push to production
   supabase db push --db-url=$PRODUCTION_DB_URL
   ```

## References

- Architecture: [Database & Storage](architecture_details.md#database--storage)
- Development: [Database Development](dev_workflow.md#database-development)
- Features: [Core Features](usage_and_features.md#core-features)
- Structure: [Database Package](project_structure.md#database-package)
