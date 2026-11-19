create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default 'Pianist' check (char_length(nickname) between 1 and 32),
  language text not null default 'ru' check (language in ('ru', 'en')),
  note_notation text not null default 'international' check (note_notation in ('international', 'russian')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  initial_nickname text;
begin
  initial_nickname := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Pianist'
  );
  insert into public.profiles (id, nickname)
  values (new.id, left(initial_nickname, 32))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own avatar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users can update their own avatar" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users can delete their own avatar" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
