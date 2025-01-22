-- PostgreSQL Extensions
-- Required extensions for AutoCRM functionality
-- Last updated: 2024-01-10

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector operations support for AI similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- Full text search support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comments
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation for primary keys';
COMMENT ON EXTENSION "vector" IS 'Vector operations for AI embeddings and similarity search';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for improved text search'; 