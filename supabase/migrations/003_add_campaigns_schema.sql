-- Campaigns V1 groups offers under a local commerce action.
-- Public access is read-only and limited to active/current campaigns.
-- Admin writes will continue through the secure server-side boundary.

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_valid_dates check (
    ends_at is null
    or starts_at is null
    or ends_at > starts_at
  )
);

create table public.campaign_offers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, offer_id)
);

create trigger set_campaigns_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

create index campaigns_slug_idx on public.campaigns(slug);
create index campaigns_is_active_idx on public.campaigns(is_active);
create index campaigns_starts_at_idx on public.campaigns(starts_at);
create index campaigns_ends_at_idx on public.campaigns(ends_at);

create index campaign_offers_campaign_id_idx on public.campaign_offers(campaign_id);
create index campaign_offers_offer_id_idx on public.campaign_offers(offer_id);

alter table public.campaigns enable row level security;
alter table public.campaign_offers enable row level security;

create policy "Public can read active current campaigns"
on public.campaigns
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy "Public can read offers from active current campaigns"
on public.campaign_offers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.campaigns
    where campaigns.id = campaign_offers.campaign_id
      and campaigns.is_active = true
      and (campaigns.starts_at is null or campaigns.starts_at <= now())
      and (campaigns.ends_at is null or campaigns.ends_at >= now())
  )
);
