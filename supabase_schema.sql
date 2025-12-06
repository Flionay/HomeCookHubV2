-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create inventory table
create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  quantity text,
  unit text,
  location text,
  category text,
  expiry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recipes table
create table if not exists public.recipes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  chef text,
  type text,
  flavor text,
  rating integer default 0,
  notes text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create settings table (for shared configuration)
create table if not exists public.settings (
  id uuid default uuid_generate_v4() primary key,
  api_url text default 'https://api.openai.com/v1',
  api_token text,
  model text default 'gpt-3.5-turbo',
  image_model text default 'dall-e-3',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.inventory enable row level security;
alter table public.recipes enable row level security;
alter table public.settings enable row level security;

-- Policies
-- We drop existing policies first to ensure we can re-run this script cleanly if needed
drop policy if exists "Inventory access" on public.inventory;
drop policy if exists "Recipes access" on public.recipes;
drop policy if exists "Settings access" on public.settings;
drop policy if exists "Public inventory access" on public.inventory;
drop policy if exists "Public recipes access" on public.recipes;

-- Allow authenticated users to do everything
create policy "Inventory access"
on public.inventory for all
to authenticated
using (true);

create policy "Recipes access"
on public.recipes for all
to authenticated
using (true);

create policy "Settings access"
on public.settings for all
to authenticated
using (true);

-- Optional: Insert a default settings row if it doesn't exist
insert into public.settings (api_url, model, image_model)
select 'https://api.openai.com/v1', 'gpt-3.5-turbo', 'dall-e-3'
where not exists (select 1 from public.settings);

-- Storage Setup
-- Note: Storage buckets usually need to be created via the Supabase Dashboard or API,
-- but we can set policies here if the bucket exists.
-- We will provide instructions to create the 'recipe-images' bucket.

-- Policy to allow authenticated users to upload images
-- Note: You need to create a bucket named 'recipe-images' in Supabase Storage first.
-- The following SQL assumes the bucket exists. 
-- If you run this without the bucket, it might fail or just do nothing useful until bucket is created.

-- Enable storage policies (This is a bit tricky in SQL editor as it depends on the `storage` schema)
-- Generally, you do this in the Storage UI, but here is the SQL equivalent for reference:

-- Allow public read access to recipe-images
-- create policy "Public Access"
-- on storage.objects for select
-- using ( bucket_id = 'recipe-images' );

-- Allow authenticated users to upload
-- create policy "Authenticated Upload"
-- on storage.objects for insert
-- to authenticated
-- with check ( bucket_id = 'recipe-images' );
