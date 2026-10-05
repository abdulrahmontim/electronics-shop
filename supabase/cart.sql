-- Bench Supply shared cart
--
-- The web app kept its cart in localStorage, which is anonymous and per-browser,
-- so the phone and the desktop could never see each other's cart. This table
-- makes the cart a property of the signed-in account in the same Supabase
-- project that already holds products and orders. Both clients read and write
-- it directly with the signed-in user's own JWT; row level security is what
-- keeps one customer's cart invisible to another.
--
-- Run this once in the Supabase SQL Editor. It is idempotent, so it is safe on
-- a project that already has schema.sql applied.

create extension if not exists pgcrypto;

-- One active cart per account: the (user_id, product_id) pair is the cart line.
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0 and quantity <= 20),
  constraint cart_items_user_product_key unique (user_id, product_id)
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- Row level security
alter table public.cart_items enable row level security;

drop policy if exists "cart_items_read_own" on public.cart_items;
drop policy if exists "cart_items_insert_own" on public.cart_items;
drop policy if exists "cart_items_update_own" on public.cart_items;
drop policy if exists "cart_items_delete_own" on public.cart_items;

create policy "cart_items_read_own" on public.cart_items
  for select using (auth.uid() = user_id);

create policy "cart_items_insert_own" on public.cart_items
  for insert with check (auth.uid() = user_id);

create policy "cart_items_update_own" on public.cart_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cart_items_delete_own" on public.cart_items
  for delete using (auth.uid() = user_id);

-- cart_add adds to an existing line instead of overwriting it, and it caps the
-- result at 20 per product. Doing this in one statement means a phone and a
-- browser hitting the same cart at the same time cannot push a line past the cap.
create or replace function public.cart_add(p_product_id uuid, p_quantity integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_current integer;
  v_added integer;
begin
  if v_uid is null then
    raise exception 'Sign in to use your cart';
  end if;

  if p_product_id is null
     or not exists (
       select 1 from products p where p.id = p_product_id and p.in_stock
     ) then
    raise exception 'That product is no longer available';
  end if;

  select ci.quantity into v_current
  from cart_items ci
  where ci.user_id = v_uid and ci.product_id = p_product_id
  for update;

  v_current := coalesce(v_current, 0);
  v_added := least(greatest(coalesce(p_quantity, 1), 1), 20 - v_current);

  if v_added <= 0 then
    return 0;
  end if;

  insert into cart_items (user_id, product_id, quantity)
  values (v_uid, p_product_id, v_current + v_added)
  on conflict (user_id, product_id)
  do update set quantity = cart_items.quantity + v_added;

  return v_added;
end;
$$;

revoke execute on function public.cart_add(uuid, integer) from public;
grant execute on function public.cart_add(uuid, integer) to authenticated;