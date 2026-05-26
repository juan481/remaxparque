alter table news add column if not exists location text;
alter table news add column if not exists event_online boolean default false;
