# ADR 003: Security Model

**Status**: Approved  
**Last Updated**: 2025-01-22

## Context  

Need to prevent unauthorized data access in multi-tenant system.

## Decision  

Defense-in-depth approach:

1. Supabase RLS for primary protection
2. Application-layer permission checks
3. Session validation middleware

    ```mermaid
    graph TD
        A[Request] --> B[Session Validation]
        B --> C[RLS Policy Check]
        C --> D[App Permission Check]
        D --> E[Data Access]
    ```

## Rationale  

- Reduces "trusted client" surface area
- Aligns with zero-trust principles
- Defense against misconfigured RLS

## Consequences  

- 2x authorization checks per request
- Synchronized policy definitions
- Complex debugging scenarios

## Alternatives  

- Application-layer only - Risk of SQL injection
- Database-only - No UI context
- Third-party authZ - Cost/vendor lock-in

## Compliance Alignment

- GDPR: Session encryption at rest/in-transit
- SOC2: Audit trails via Supabase logs
- HIPAA: Potential through dedicated storage
