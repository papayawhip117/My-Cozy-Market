-- Paw Pal database setup.
-- Paste this whole file into Supabase -> SQL Editor -> New query, and Run.
-- It's safe to run again later (it only creates what's missing and
-- replaces the functions).
--
-- What it makes:
--   invite_codes  secret codes; you need an unused one to sign up
--   check_invite  lets the sign-up screen ask "is this code OK?"
--   profiles      one row per player: display name + their save
--   a trigger     runs on every new sign-up: checks + uses up the code,
--                 and makes the player's profile row

-- ---------- invite codes ----------

create table if not exists public.invite_codes (
  code       text primary key,
  used_by    uuid null references auth.users (id) on delete set null,
  used_at    timestamptz null,
  created_at timestamptz not null default now()
);

-- Row Level Security on, with NO policies: nobody using the public key
-- can read or change this table. Only the functions below (and you, in
-- the dashboard) can touch it.
alter table public.invite_codes enable row level security;

-- "Is this code real and unused?" Runs with the owner's rights
-- (security definer), so it can peek at the table without exposing it.
-- It only ever answers true/false.
create or replace function public.check_invite(code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.invite_codes ic
    where ic.code = upper(trim(check_invite.code))
      and ic.used_by is null
  );
$$;

revoke all on function public.check_invite(text) from public;
grant execute on function public.check_invite(text) to anon, authenticated;

-- ---------- profiles (display name + save) ----------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Pal',
  save         jsonb null,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Players can only see and change their OWN row.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- (No insert policy: the trigger below makes the row.)

-- ---------- the sign-up gatekeeper ----------

-- Runs inside the sign-up itself. If it raises an error, the account is
-- NOT created, so nobody gets in without a good code, even if they skip
-- the game's sign-up screen and call Supabase directly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  name   text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 24);
begin
  if invite = '' then
    raise exception 'INVITE_REQUIRED: an invite code is needed to sign up';
  end if;

  -- Use up the code. "used_by is null" makes sure it's still free;
  -- if nothing was updated, the code was wrong or already taken.
  update public.invite_codes
     set used_by = new.id, used_at = now()
   where code = invite and used_by is null;

  if not found then
    raise exception 'INVITE_INVALID: that invite code is not valid or was already used';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(name, ''), 'Pal'));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- making invite codes ----------
-- Run lines like these whenever you want to invite someone
-- (codes are matched in CAPITALS, so type them in capitals here):
--
--   insert into public.invite_codes (code) values ('MOSSY-FERN-42');
--   insert into public.invite_codes (code) values ('LANTERN-7'), ('FOXGLOVE-3');
--
-- See who used which code:
--
--   select code, used_at, p.display_name
--   from public.invite_codes ic left join public.profiles p on p.id = ic.used_by;
