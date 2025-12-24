-- Create a table to cache budget analysis reports
create table if not exists budget_cache (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  days int not null,
  travelers int not null,
  budget numeric not null,
  currency text not null,
  report text not null,
  created_at timestamptz default now(),
  
  -- Create a unique constraint to ensure we don't duplicate cache entries for the same inputs
  unique(destination, days, travelers, budget, currency)
);

-- Enable RLS (though for now we might leave it open for reading by authenticated users)
alter table budget_cache enable row level security;

-- Allow anyone (authenticated) to read/insert for now, as this is a shared knowledge base
create policy "Enable read access for authenticated users"
on budget_cache for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on budget_cache for insert
to authenticated
with check (true);
