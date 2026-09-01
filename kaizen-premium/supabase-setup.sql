alter table public.products
add column if not exists description text not null default '';

alter table public.products
add column if not exists image_url text;

alter table public.products
add column if not exists active boolean not null default true;

alter table public.products
add column if not exists sort_order integer;

alter table public.products
add column if not exists updated_at timestamptz not null default now();

create policy "public visible products"
on public.products
for select
to anon, authenticated
using (
  active = true
  or exists(
    select 1
    from public.admin_users p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);