-- CONTROL DE COMIDAS - esquema inicial
-- Ejecutar completo en Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

do $$ begin
  create type public.tipo_rol as enum ('usuario','admin_local','superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_pedido as enum ('borrador','confirmado','cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default 'Usuario',
  correo text,
  rol public.tipo_rol not null default 'usuario',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'General',
  precio numeric(12,2) not null check(precio >= 0),
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles(id),
  fecha date not null default current_date,
  estado public.estado_pedido not null default 'confirmado',
  observacion text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(usuario_id,fecha)
);

create table if not exists public.detalle_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check(cantidad > 0),
  precio_unitario numeric(12,2) not null check(precio_unitario >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_pedidos_usuario on public.pedidos(usuario_id);
create index if not exists idx_pedidos_fecha on public.pedidos(fecha);
create index if not exists idx_detalle_pedido on public.detalle_pedido(pedido_id);

-- Perfil automático al crear una cuenta Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfiles(id,nombre,correo,rol,activo)
  values(new.id,coalesce(new.raw_user_meta_data->>'nombre',split_part(new.email,'@',1)),new.email,'usuario',true)
  on conflict(id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Funciones de rol privadas para RLS.
create schema if not exists private;
create or replace function private.mi_rol()
returns public.tipo_rol language sql stable security definer set search_path=''
as $$ select rol from public.perfiles where id=(select auth.uid()) and activo=true limit 1 $$;

revoke all on function private.mi_rol() from public;
grant usage on schema private to authenticated;
grant execute on function private.mi_rol() to authenticated;

alter table public.perfiles enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedido enable row level security;

-- PERFIL
drop policy if exists "perfil propio o admin" on public.perfiles;
create policy "perfil propio o admin" on public.perfiles for select to authenticated
using ((select auth.uid())=id or (select private.mi_rol()) in ('admin_local','superadmin'));

-- PRODUCTOS
drop policy if exists "productos visibles" on public.productos;
create policy "productos visibles" on public.productos for select to authenticated using (true);
drop policy if exists "admin local modifica productos" on public.productos;
create policy "admin local modifica productos" on public.productos for update to authenticated
using ((select private.mi_rol()) in ('admin_local','superadmin'))
with check ((select private.mi_rol()) in ('admin_local','superadmin'));

-- PEDIDOS
drop policy if exists "leer pedidos propios o admin" on public.pedidos;
create policy "leer pedidos propios o admin" on public.pedidos for select to authenticated
using ((select auth.uid())=usuario_id or (select private.mi_rol()) in ('admin_local','superadmin'));
drop policy if exists "crear pedido propio" on public.pedidos;
create policy "crear pedido propio" on public.pedidos for insert to authenticated
with check ((select auth.uid())=usuario_id);
drop policy if exists "actualizar pedido propio o admin" on public.pedidos;
create policy "actualizar pedido propio o admin" on public.pedidos for update to authenticated
using ((select auth.uid())=usuario_id or (select private.mi_rol()) in ('admin_local','superadmin'))
with check ((select auth.uid())=usuario_id or (select private.mi_rol()) in ('admin_local','superadmin'));

-- DETALLE
drop policy if exists "leer detalle permitido" on public.detalle_pedido;
create policy "leer detalle permitido" on public.detalle_pedido for select to authenticated
using (exists(select 1 from public.pedidos p where p.id=pedido_id and (p.usuario_id=(select auth.uid()) or (select private.mi_rol()) in ('admin_local','superadmin'))));
drop policy if exists "insertar detalle permitido" on public.detalle_pedido;
create policy "insertar detalle permitido" on public.detalle_pedido for insert to authenticated
with check (exists(select 1 from public.pedidos p where p.id=pedido_id and (p.usuario_id=(select auth.uid()) or (select private.mi_rol()) in ('admin_local','superadmin'))));
drop policy if exists "actualizar detalle admin" on public.detalle_pedido;
create policy "actualizar detalle admin" on public.detalle_pedido for update to authenticated
using ((select private.mi_rol()) in ('admin_local','superadmin'))
with check ((select private.mi_rol()) in ('admin_local','superadmin'));
drop policy if exists "borrar detalle propio o admin" on public.detalle_pedido;
create policy "borrar detalle propio o admin" on public.detalle_pedido for delete to authenticated
using (exists(select 1 from public.pedidos p where p.id=pedido_id and (p.usuario_id=(select auth.uid()) or (select private.mi_rol()) in ('admin_local','superadmin'))));

grant select on public.perfiles to authenticated;
grant select,update on public.productos to authenticated;
grant select,insert,update on public.pedidos to authenticated;
grant select,insert,update,delete on public.detalle_pedido to authenticated;

-- Menú inicial. La última "Burritas L60" de la pizarra se deja como producto separado por confirmar.
insert into public.productos(nombre,categoria,precio,orden)
select * from (values
 ('Baleada sencilla','Baleadas',17,1),('Baleada con huevo','Baleadas',22,2),
 ('Baleada huevo y jamón','Baleadas',32,3),('Baleada huevo y extremeño','Baleadas',32,4),
 ('Baleada con pollo','Baleadas',32,5),('Baleada con todo','Baleadas',36,6),
 ('Tortilla quesillo','Tortillas',17,7),('Tortilla quesillo / huevo','Tortillas',22,8),
 ('Tortilla quesillo / pollo','Tortillas',22,9),('Desayuno maíz','Desayunos',45,10),
 ('Desayuno harina','Desayunos',50,11),('Pastelitos','Otros',30,12),
 ('Burritas','Otros',37,13),('Gringas','Otros',37,14),('Almuerzos','Almuerzos',90,15),
 ('Burritas L60 (confirmar nombre)','Otros',60,16)
) as v(nombre,categoria,precio,orden)
where not exists(select 1 from public.productos);

-- IMPORTANTE: después de crear TU usuario en Authentication > Users,
-- ejecuta reemplazando el correo:
-- update public.perfiles set rol='superadmin' where lower(correo)=lower('TU_CORREO@DOMINIO.COM');
