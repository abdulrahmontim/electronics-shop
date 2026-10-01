-- Bench Supply schema
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category text not null,
  price_ngn integer not null check (price_ngn > 0),
  image_url text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  total_ngn integer not null check (total_ngn >= 0),
  status text not null default 'placed',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price_ngn integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "products_read_all" on public.products;
create policy "products_read_all" on public.products for select using (true);

drop policy if exists "orders_read_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_read_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);

drop policy if exists "order_items_read_own" on public.order_items;
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_read_own" on public.order_items for select using (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order_items_insert_own" on public.order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

-- place_order function
create or replace function public.place_order(
  p_full_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_state text,
  p_items jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
  v_order_id uuid;
  v_total bigint := 0;
  rec record;
  item jsonb;
  merged jsonb := '[]'::jsonb;
  m_key text;
  m_qty integer;
  matched_count integer := 0;
  line record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Sign in to place an order';
  end if;

  if trim(coalesce(p_full_name,'')) = '' or trim(coalesce(p_phone,'')) = '' or
     trim(coalesce(p_address,'')) = '' or trim(coalesce(p_city,'')) = '' or
     trim(coalesce(p_state,'')) = '' then
    raise exception 'Fill in every delivery field';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  -- merge
  for item in select * from jsonb_array_elements(p_items) as t
  loop
    if item ? 'product_id' and item ? 'quantity' then
      m_key := item->>'product_id';
      m_qty := (item->>'quantity')::integer;
      if m_qty is null then m_qty := 0; end if;
      m_qty := greatest(1, least(20, m_qty));
      -- merge in temp structure not needed; just sum by updating conceptually
      -- build merged map via loop
    end if;
  end loop;

  -- simpler merge
  merged := '[]'::jsonb;
  for item in select * from jsonb_array_elements(p_items) as t
  loop
    if item ? 'product_id' and item ? 'quantity' then
      declare
        pid uuid;
        q integer;
        found boolean := false;
      begin
        pid := (item->>'product_id')::uuid;
        q := (item->>'quantity')::integer;
        if q < 1 then q := 1; end if;
        if q > 20 then q := 20; end if;
        -- merge
        for i in 0..jsonb_array_length(merged)-1 loop
          if (merged->i->>'product_id')::uuid = pid then
            merged := jsonb_set(merged, array[(i)::text, 'quantity'], to_jsonb(((merged->i->>'quantity')::integer + q)));
            found := true;
            exit;
          end if;
        end loop;
        if not found then
          merged := merged || jsonb_build_object('product_id', pid, 'quantity', q);
        end if;
      end;
    end if;
  end loop;

  if jsonb_array_length(merged) = 0 then
    raise exception 'Your cart is empty';
  end if;

  -- compute total and validate stock
  v_total := 0;
  matched_count := 0;
  for line in 
    select m.product_id, m.quantity, p.price_ngn, p.name, p.in_stock
    from jsonb_to_recordset(merged) as m(product_id uuid, quantity integer)
    left join products p on p.id = m.product_id and p.in_stock = true
  loop
    if line.price_ngn is not null and line.in_stock is true then
      v_total := v_total + (line.price_ngn::bigint * line.quantity::bigint);
      matched_count := matched_count + 1;
    end if;
  end loop;

  if matched_count <> jsonb_array_length(merged) then
    raise exception 'Some items in your cart are no longer available';
  end if;

  v_email := auth.jwt() ->> 'email';
  if v_email is null then
    v_email := '';
  end if;

  insert into orders (user_id, email, full_name, phone, address, city, state, total_ngn, status)
  values (v_uid, v_email, p_full_name, p_phone, p_address, p_city, p_state, v_total::integer, 'placed')
  returning id into v_order_id;

  insert into order_items (order_id, product_id, product_name, unit_price_ngn, quantity)
  select v_order_id, m.product_id, p.name, p.price_ngn, m.quantity
  from jsonb_to_recordset(merged) as m(product_id uuid, quantity integer)
  join products p on p.id = m.product_id and p.in_stock = true;

  return v_order_id;
end;
$$;

revoke execute on function public.place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,jsonb) to authenticated;