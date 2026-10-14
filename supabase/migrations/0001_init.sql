-- Tiles: one row per tile, owned by the signed-in user. Type-specific fields live in `data`.
create table public.tiles (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  type text not null check (type in ('youtube', 'text', 'image', 'website')),
  x int not null check (x >= 0),
  y int not null check (y >= 0),
  w int not null check (w >= 2),
  h int not null check (h >= 2),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (x + w <= 16)
);

create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tiles_touch_updated_at
before update on public.tiles
for each row execute function public.touch_updated_at();

alter table public.tiles enable row level security;

revoke all on public.tiles from anon;
grant select, insert, update, delete on public.tiles to authenticated;

create policy "Users manage their own tiles"
on public.tiles for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Photos: a private bucket where each user can only touch files in a folder named after their id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/webp', 'image/jpeg']);

create policy "Users manage their own photos"
on storage.objects for all to authenticated
using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
