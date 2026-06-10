-- Public read access for the MVP.
-- Write/admin flows will be handled later with auth or a secure server-side boundary.

alter table public.categories enable row level security;
alter table public.merchants enable row level security;
alter table public.offers enable row level security;
alter table public.coupon_redemptions enable row level security;

create policy "Public can read categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Public can read active merchants"
on public.merchants
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active current offers"
on public.offers
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

-- Coupon redemptions stay private for now.
-- No public SELECT policy and no write policies are created in this MVP step.
