create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  address text,
  city text,
  phone text,
  website_url text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  featured_promotion text,
  customer_benefit text,
  business_goal text,
  coupon_code text,
  qr_token text unique,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  max_redemptions integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_valid_dates check (
    ends_at is null
    or starts_at is null
    or ends_at > starts_at
  ),
  constraint offers_valid_max_redemptions check (
    max_redemptions is null
    or max_redemptions > 0
  )
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  coupon_code text,
  qr_token text,
  redeemed_at timestamptz not null default now(),
  notes text
);

create trigger set_merchants_updated_at
before update on public.merchants
for each row
execute function public.set_updated_at();

create trigger set_offers_updated_at
before update on public.offers
for each row
execute function public.set_updated_at();

create index categories_slug_idx on public.categories(slug);

create index merchants_category_id_idx on public.merchants(category_id);
create index merchants_is_active_idx on public.merchants(is_active);
create index merchants_city_idx on public.merchants(city);
create index merchants_name_idx on public.merchants(name);

create index offers_merchant_id_idx on public.offers(merchant_id);
create index offers_is_active_idx on public.offers(is_active);
create index offers_starts_at_idx on public.offers(starts_at);
create index offers_ends_at_idx on public.offers(ends_at);
create index offers_coupon_code_idx on public.offers(coupon_code);

create index coupon_redemptions_offer_id_idx on public.coupon_redemptions(offer_id);
create index coupon_redemptions_merchant_id_idx on public.coupon_redemptions(merchant_id);
create index coupon_redemptions_redeemed_at_idx on public.coupon_redemptions(redeemed_at);
