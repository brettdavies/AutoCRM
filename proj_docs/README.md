# System Documentation Structure

## How These Documents Work Together

• Each file contains unique information with clear ownership of specific topics
• Cross-references use markdown section anchors (e.g., `[Database Schema](#database-schema)`)
• Information is never duplicated - instead, link to the canonical source
• All documents follow the same frontmatter structure:

  ```markdown
  ---
  title: "Document Title"
  version: "1.0.0"
  last_updated: "2025-01-20"
  ---
  ```

## Document Hierarchy

```plaintext
system_overview.md           (High-level introduction)
├── project_overview.md      (Project details & goals)
├── architecture_details.md  (Technical architecture)
├── data_model_and_schema.md (Database structure)
├── project_structure.md     (Codebase organization)
├── dev_workflow.md         (Development processes)
└── usage_and_features.md   (Features & usage)
```

## 1. system_overview.md

• Purpose: High-level introduction to AutoCRM
• Key Sections:

  - Project Vision
  - Scope & Objectives
  - Stakeholders & Roles
  - Core Features Summary
• Links to: project_overview.md#project-details, architecture_details.md#architecture-overview

## 2. project_overview.md

• Purpose: Detailed project information and goals
• Key Sections:

  - Project Goals
  - Technical Vision
  - Feature Overview
  - Integration Points
• Links to: architecture_details.md#technology-stack, usage_and_features.md#core-features

## 3. architecture_details.md

• Purpose: Technical architecture and design decisions
• Key Sections:

  - System Components
  - Technology Stack
  - Data Flow
  - AI Integration
  - Email Architecture (Resend)
  - Security & Scaling
• Links to: data_model_and_schema.md#schema-design, project_structure.md#package-overview

## 4. data_model_and_schema.md

• Purpose: Database schema and relationships
• Key Sections:

  - Data Model Summary
  - Core Entities
  - Schema Organization
  - Migration Strategy
• Links to: dev_workflow.md#database-development, architecture_details.md#database--storage

## 5. project_structure.md

• Purpose: Codebase organization and conventions
• Key Sections:

  - Directory Structure
  - Package Overview
  - Naming Conventions
  - Best Practices
• Links to: dev_workflow.md#development-workflow, architecture_details.md#system-components

## 6. dev_workflow.md

• Purpose: Development processes and guidelines
• Key Sections:

  - Environment Setup
  - Development Flow
  - Testing Strategy
  - Deployment Process
• Links to: data_model_and_schema.md#migration-strategy, project_structure.md#best-practices

## 7. usage_and_features.md

• Purpose: Feature documentation and usage guides
• Key Sections:

  - Core Features
  - User Scenarios
  - Rate Limits
  - Security Constraints
• Links to: architecture_details.md#security-architecture, project_overview.md#feature-overview

## Cross-Reference Examples

Good:

```markdown
[See Database Schema](./data_model_and_schema.md#schema-design)
[Development Guidelines](./dev_workflow.md#development-workflow)
```

Bad:

```markdown
[See Database Schema](./data_model_and_schema.md) <!-- No section anchor -->
[Development Guidelines](dev_workflow.md) <!-- Missing ./ prefix -->
```

## Information Ownership

• Architecture & Infrastructure: architecture_details.md
• Database Structure: data_model_and_schema.md
• Development Practices: dev_workflow.md
• Feature Documentation: usage_and_features.md
• Code Organization: project_structure.md
• Project Goals: project_overview.md
• High-level Overview: system_overview.md
