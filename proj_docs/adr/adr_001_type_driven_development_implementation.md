# ADR 001: Type-Driven Development Implementation

**Status**: Approved  
**Last Updated**: 2025-01-22

## Context  

Needed to ensure data integrity across UI <> API <> Database layers with evolving requirements.

## Decision  

Implement end-to-end type safety using:

1. Supabase schema -> TypeScript types generation
2. Zod for runtime validation
3. Type narrowing for API responses

    ```mermaid
    graph LR
        A[DB Schema] --> B[TypeGen]
        B --> C[API Types]
        C --> D[Zod Schemas]
        D --> E[UI Components]
    ```

## Rationale  

- Catches 40%+ potential bugs at build time
- Enables auto-complete across stack
- Documents data contracts implicitly

## Consequences  

- Added 15% build time
- Requires strict schema discipline
- New dev onboarding curve

## Alternatives Considered  

- PropTypes - Limited to React only
- JSDoc - No build-time checks
- Flow - Less ecosystem support

## Vendor Strategy

- Supabase TypeGen: MIT-licensed, replaceable with custom generator
- Zod: 1.2M weekly downloads, core team maintenance
- Exit Plan: Schema types could be regenerated via Prisma if needed
