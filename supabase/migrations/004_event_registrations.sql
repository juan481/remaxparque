-- Inscripciones a eventos futuros
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  user_id uuid not null references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Index for fast per-event lookups
create index if not exists idx_event_reg_event_id on event_registrations(event_id);
create index if not exists idx_event_reg_user_id  on event_registrations(user_id);