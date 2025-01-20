---
title: "Development Workflow"
version: "1.0.0"
last_updated: "2025-01-20"
---

# Development Workflow

## Table of Contents

- [Development Workflow](#development-workflow)
  - [Table of Contents](#table-of-contents)
  - [Environment Setup](#environment-setup)
    - [Prerequisites](#prerequisites)
    - [Local Development](#local-development)
    - [Environment Configuration](#environment-configuration)
  - [Development Tools](#development-tools)
    - [AI-Assisted Development](#ai-assisted-development)
    - [IDE Configuration](#ide-configuration)
  - [Database Development](#database-development)
    - [Local Database](#local-database)
    - [Migration Process](#migration-process)
    - [Schema Changes](#schema-changes)
  - [Branching Strategy](#branching-strategy)
    - [Branch Types](#branch-types)
    - [Branch Naming](#branch-naming)
    - [Branch Lifecycle](#branch-lifecycle)
  - [Commit Guidelines](#commit-guidelines)
    - [Commit Message Format](#commit-message-format)
    - [Commit Types](#commit-types)
  - [Testing Strategy](#testing-strategy)
    - [Test Types](#test-types)
    - [AI Component Testing](#ai-component-testing)
    - [Test Environment](#test-environment)
  - [Code Review Process](#code-review-process)
    - [Pull Request Guidelines](#pull-request-guidelines)
    - [Review Checklist](#review-checklist)
  - [CI/CD Pipeline](#cicd-pipeline)
    - [Continuous Integration](#continuous-integration)
    - [Deployment Process](#deployment-process)
  - [Release Management](#release-management)
    - [Version Control](#version-control)
    - [Release Process](#release-process)
  - [References to Other Docs](#references-to-other-docs)

## Environment Setup

### Prerequisites

- Node.js v18+ (for frontend and Edge Functions)
- Python 3.9+ (for AI components)
- Docker Desktop (for local development)
- Supabase CLI
- AWS CLI (for Amplify deployments)

```bash
# Install core dependencies
npm install -g supabase-cli
npm install -g @aws-amplify/cli

# Configure Supabase
supabase login

# Configure AWS
aws configure
```

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/your-org/autocrm.git
cd autocrm

# Install dependencies
npm install
python -m pip install -r requirements.txt
```

2. Start local services:

```bash
# Start Supabase locally
supabase start

# Start development server
npm run dev
```

### Environment Configuration

Create environment files based on templates:

```bash
# Development
cp .env.example .env.development

# Testing
cp .env.example .env.test

# Production
cp .env.example .env.production
```

Required environment variables are documented in [Architecture Details](./architecture_details.md#configuration).

## Development Tools

### AI-Assisted Development

AutoCRM leverages AI tools for enhanced development:

1. **Cursor AI**:
   - Primary IDE for AI-assisted development
   - Use for code generation and refactoring
   - Configure with project-specific context

   ```json
   {
     "ai": {
       "context_files": [
         "proj_docs/*.md",
         "templates/*.md"
       ],
       "model": "gpt-4"
     }
   }
   ```

2. **Lovable**:
   - Product management and feature planning
   - Integration with GitHub issues
   - AI-powered requirement analysis

### IDE Configuration

Standard VS Code/Cursor settings:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "python.formatting.provider": "black"
}
```

## Database Development

### Local Database

Supabase provides local development database:

```bash
# Start local Supabase
supabase start

# Access local database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/database.ts
```

### Migration Process

1. Create new migration:

```bash
supabase migration new add_feature_x
```

2. Edit migration file in `supabase/migrations/`:

```sql
-- Enable RLS
alter table public.my_table enable row level security;

-- Create policies
create policy "Users can view own data"
  on public.my_table for select
  using ( auth.uid() = user_id );
```

3. Apply migration:

```bash
# Local
supabase db reset

# Production
supabase db push
```

### Schema Changes

1. Create schema change in `db/schema/`:
   - Follow naming convention: `XX_entity_name.sql`
   - Include up/down migrations
   - Add table comments and constraints

2. Update types:

```bash
supabase gen types typescript --local > src/types/database.ts
```

3. Test changes:

```bash
npm run test:db
```

## Branching Strategy

### Branch Types

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `refactor/*`: Code improvements
- `ai/*`: AI component updates

### Branch Naming

Format: `type/issue-number-description`

Examples:

```
feature/123-ai-response-generation
fix/456-ticket-routing-bug
refactor/789-optimize-vector-search
```

### Branch Lifecycle

1. Create from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/123-description
```

2. Regular updates:

```bash
git fetch origin
git rebase origin/develop
```

3. Merge process:

```bash
# Update branch
git fetch origin
git rebase origin/develop

# Push changes
git push origin feature/123-description

# Create pull request
gh pr create
```

## Commit Guidelines

### Commit Message Format

```plaintext
type(scope): description

[optional body]

[optional footer]
```

Example:

```plaintext
feat(ai): implement RAG-based response generation

- Add vector search for knowledge base
- Implement response templating
- Add confidence scoring

Closes #123
```

### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code improvements
- `docs`: Documentation
- `test`: Test updates
- `chore`: Maintenance
- `ai`: AI component changes

## Testing Strategy

### Test Types

1. **Unit Tests**:

```bash
# Run unit tests
npm run test:unit
```

2. **Integration Tests**:

```bash
# Run integration tests
npm run test:integration
```

3. **E2E Tests**:

```bash
# Run E2E tests
npm run test:e2e
```

### AI Component Testing

1. **Response Generation**:

```python
def test_ai_response():
    response = generate_response(
        query="How do I reset my password?",
        context=get_relevant_docs()
    )
    assert response.confidence > 0.8
    assert len(response.text) > 0
```

2. **Vector Search**:

```python
def test_vector_search():
    results = search_knowledge_base(
        query="password reset",
        limit=5
    )
    assert len(results) > 0
```

### Test Environment

Configure test environment:

```bash
# Set up test database
supabase db reset --db-url=$TEST_DB_URL

# Run migrations
supabase db push --db-url=$TEST_DB_URL

# Run all tests
npm run test
```

## Code Review Process

### Pull Request Guidelines

1. **Title Format**:

```plaintext
type(scope): description (#issue)
```

2. **Description Template**:

```markdown
## Changes
- Implemented X
- Updated Y
- Fixed Z

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] AI component tests

## Screenshots
[If applicable]

## Related Issues
Closes #123
```

### Review Checklist

- [ ] Code follows style guide
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] AI components are tested
- [ ] Database migrations are reversible
- [ ] Security considerations addressed

## CI/CD Pipeline

### Continuous Integration

AWS Amplify handles CI:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

### Deployment Process

1. **Development**:
   - Auto-deploy from `develop`
   - Preview environments per PR

2. **Staging**:
   - Manual promotion from `develop`
   - Full integration testing

3. **Production**:
   - Manual promotion from `main`
   - Requires approval

## Release Management

### Version Control

Follow semantic versioning:

```bash
# Create release
npm version minor
git push origin v1.2.0
```

### Release Process

1. Update version:

```bash
# Update version
npm version minor

# Update changelog
conventional-changelog -p angular -i CHANGELOG.md -s
```

2. Create release PR:

```bash
gh pr create --base main --head release/v1.2.0
```

3. After merge:

```bash
# Tag release
git tag v1.2.0
git push origin v1.2.0

# Deploy to production
amplify push prod
```

## References to Other Docs

- For data model details, see [Data Model & Schema](./data_model_and_schema.md)
- For API documentation, see [Architecture Details](./architecture_details.md#api-endpoints)
- For feature specifications, see [Usage and Features](./usage_and_features.md)
- For AI integration details, see [Architecture Details](./architecture_details.md#ai-integration)
