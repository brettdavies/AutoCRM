# AutoCRM

An AI-augmented customer support platform built with Supabase.

## Documentation Structure

Our documentation is organized into several key files, each serving a specific purpose:

```plaintext
docs/
├── system_overview.md         # High-level introduction
├── project_overview.md        # Detailed project information
├── architecture_details.md    # Technical architecture
├── data_model_and_schema.md  # Database structure
├── project_structure.md      # Codebase organization
├── dev_workflow.md           # Development processes
└── usage_and_features.md     # Feature documentation
```

### Core Documentation

1. **[System Overview](templates/system_overview.md)**
   - Project vision and goals
   - High-level architecture
   - Key stakeholders

2. **[Project Overview](templates/project_overview.md)**
   - Detailed project scope
   - Technical requirements
   - Integration points

3. **[Architecture Details](templates/architecture_details.md)**
   - System components
   - Data flow
   - Security model
   - AI integration

4. **[Data Model & Schema](templates/data_model_and_schema.md)**
   - Database structure
   - Entity relationships
   - Schema organization
   - Migration strategy

5. **[Project Structure](templates/project_structure.md)**
   - Directory organization
   - Code conventions
   - Package management
   - Configuration

6. **[Development Workflow](templates/dev_workflow.md)**
   - Setup instructions
   - Development process
   - Testing strategy
   - Deployment guide

7. **[Usage & Features](templates/usage_and_features.md)**
   - Feature documentation
   - API endpoints
   - User scenarios
   - Rate limits

## Project Structure

```plaintext
AutoCRM/
├── db/                    # Database
│   ├── schema/           # SQL schema files
│   ├── migrations/       # Database migrations
│   └── seeds/           # Test data
├── supabase/            # Supabase config
│   ├── functions/       # Edge Functions
│   └── config.toml      # Project settings
├── src/                 # Source code
│   ├── components/      # React components
│   ├── lib/            # Shared utilities
│   └── pages/          # Next.js pages
├── tests/              # Test suite
│   ├── unit/          # Unit tests
│   └── integration/   # Integration tests
└── docs/              # Documentation
```

## Getting Started

1. **Prerequisites**:

   ```bash
   node -v  # v18 or higher
   pnpm -v  # v8 or higher
   supabase -v  # Latest version
   ```

2. **Installation**:

   ```bash
   # Clone repository
   git clone https://github.com/yourusername/autocrm.git
   cd autocrm

   # Install dependencies
   pnpm install

   # Setup Supabase
   supabase init
   supabase start
   ```

3. **Development**:

   ```bash
   # Start development server
   pnpm dev

   # Run tests
   pnpm test

   # Build for production
   pnpm build
   ```

## Contributing

See [Development Workflow](templates/dev_workflow.md) for detailed contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
