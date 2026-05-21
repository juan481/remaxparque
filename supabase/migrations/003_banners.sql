-- Tabla para banners del home
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  title text,
  is_active boolean default false,
  parque_visibility text default 'both',
  created_at timestamptz default now()
);