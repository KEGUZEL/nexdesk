-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null check (role in ('customer', 'agent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Allow public read of profiles" on public.profiles
  for select using (true);

create policy "Allow individual insert of profiles" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow individual update of profiles" on public.profiles
  for update using (auth.uid() = id);


-- 2. TICKETS TABLE
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  priority text not null check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  attachment_url text,
  attachment_name text
);

alter table public.tickets enable row level security;

create policy "Allow users to view their own tickets or agents to view all" on public.tickets
  for select using (
    auth.uid() = creator_id or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'agent'
    )
  );

create policy "Allow customers to insert their own tickets" on public.tickets
  for insert with check (
    auth.uid() = creator_id
  );

create policy "Allow customers to close their own tickets or agents to update status" on public.tickets
  for update using (
    auth.uid() = creator_id or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'agent'
    )
  );


-- 3. COMMENTS TABLE
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Allow users to read comments on visible tickets" on public.comments
  for select using (
    exists (
      select 1 from public.tickets
      where id = ticket_id and (
        creator_id = auth.uid() or 
        exists (
          select 1 from public.profiles 
          where id = auth.uid() and role = 'agent'
        )
      )
    )
  );

create policy "Allow users to add comments on visible tickets" on public.comments
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tickets
      where id = ticket_id and (
        creator_id = auth.uid() or 
        exists (
          select 1 from public.profiles 
          where id = auth.uid() and role = 'agent'
        )
      )
    )
  );


-- 4. STORAGE BUCKET FOR ATTACHMENTS
insert into storage.buckets (id, name, public) 
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Public Select" on storage.objects for select using (bucket_id = 'attachments');
create policy "Public Insert" on storage.objects for insert with check (bucket_id = 'attachments');
create policy "Public Update" on storage.objects for update using (bucket_id = 'attachments');
create policy "Public Delete" on storage.objects for delete using (bucket_id = 'attachments');


-- 5. EXPLICIT GRANTS FOR ROLES
grant usage on schema public to postgres, service_role, authenticated, anon;
grant all on all tables in schema public to postgres, service_role, authenticated, anon;
grant all on all sequences in schema public to postgres, service_role, authenticated, anon;
grant all on all routines in schema public to postgres, service_role, authenticated, anon;

-- Explicit grants for the storage schema (necessary for PostgREST & Storage upload client API)
grant usage on schema storage to postgres, service_role, authenticated, anon;
grant all on all tables in schema storage to postgres, service_role, authenticated, anon;
grant all on all sequences in schema storage to postgres, service_role, authenticated, anon;
