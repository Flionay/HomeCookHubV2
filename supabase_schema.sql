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
  share_image_model text default 'dall-e-3', -- New field for share image model
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cooking_logs table (for timeline/memories)
create table if not exists public.cooking_logs (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  meal_name text not null,
  menu jsonb, -- Store detailed menu structure { dishes: [], soups: [], staples: [] }
  ingredients text[], -- Array of ingredient names used
  mood_text text, -- AI generated warm text or user note
  image_url text, -- URL of the memory card image or food photo
  tags text[], -- e.g. ["dinner", "healthy"]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.inventory enable row level security;
alter table public.recipes enable row level security;
alter table public.settings enable row level security;
alter table public.cooking_logs enable row level security;

-- Policies
-- We drop existing policies first to ensure we can re-run this script cleanly if needed
drop policy if exists "Inventory access" on public.inventory;
drop policy if exists "Recipes access" on public.recipes;
drop policy if exists "Settings access" on public.settings;
drop policy if exists "Cooking logs access" on public.cooking_logs;
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

create policy "Cooking logs access"
on public.cooking_logs for all
to authenticated
using (true);

-- Optional: Insert a default settings row if it doesn't exist
insert into public.settings (api_url, model, image_model, share_image_model)
select 'https://api.openai.com/v1', 'gpt-3.5-turbo', 'dall-e-3', 'dall-e-3'
where not exists (select 1 from public.settings);
