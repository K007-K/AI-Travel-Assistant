-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your knowledge base
create table knowledge_base (
  id bigserial primary key,
  content text, -- The text content (chunk)
  metadata jsonb, -- Extra info (city, type, url, etc)
  embedding vector(384), -- 384 dimensions for 'all-MiniLM-L6-v2'
  verification_level text default 'unverified', -- 'verified', 'user_generated', etc
  created_at timestamp with time zone default now()
);

-- Turn on RLS
alter table knowledge_base enable row level security;

-- Allow public read access (for now)
create policy "Allow public read access" on knowledge_base for select using (true);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
end;
$$;
