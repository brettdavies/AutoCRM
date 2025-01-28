# ADR 002: Real-Time Implementation

**Status**: Approved  
**Last Updated**: 2025-01-22

## Context  

Required live updates for collaborative features without excessive polling.

## Decision  

Use Supabase Postgres changes with React Query invalidation:

```typescript
// Implementation pattern
const { data } = useQuery({
  queryKey: ['tickets'],
  queryFn: fetchTickets,
  staleTime: 60_000
});

useEffect(() => {
  const channel = supabase.channel('tickets')
    .on('postgres_changes', handleChange)
    .subscribe();
  
  return () => { channel.unsubscribe(); }
}, []);
```

## Rationale  

- Leverages existing RLS policies
- No additional infrastructure
- Bidirectional type safety

## Consequences  

- PostgreSQL load increased 20%
- Requires connection pooling
- Client-side merge logic complexity

## Alternatives  

1. Socket.IO - Additional server needed
2. GraphQL Subscriptions - Higher complexity
3. Polling - Poor user experience

## Cost Implications

| Approach | Monthly Cost (10k users) | Scalability |
|----------|--------------------------|-------------|
| Supabase Realtime | $250 | Linear scaling |
| Socket.IO (Self-hosted) | $1,200+ | Complex scaling |
| Polling | $800 | High latency cost |
