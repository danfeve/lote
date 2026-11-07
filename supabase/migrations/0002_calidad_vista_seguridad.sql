create or replace view public.v_lotes with (security_invoker = true) as
select
  l.codigo,
  l.producto,
  l.fecha_produccion,
  l.cantidad_producida,
  l.muestra_minima,
  l.estado,
  l.fecha_decision,
  l.created_at,
  l.proveedor_id,
  p.nombre as proveedor_nombre,
  p.activo as proveedor_activo,
  (select count(*)::int from public.inspecciones i where i.codigo_lote = l.codigo) as total_inspecciones,
  u.numero_inspeccion as ultima_numero,
  u.piezas_muestreadas as ultima_muestreadas,
  u.piezas_defectuosas as ultima_defectuosas,
  u.piezas_criticas as ultima_criticas,
  u.porcentaje_defectuoso as ultima_porcentaje,
  u.regla as ultima_regla
from public.lotes l
join public.proveedores p on p.id = l.proveedor_id
left join lateral (
  select i.numero_inspeccion, i.piezas_muestreadas, i.piezas_defectuosas,
         i.piezas_criticas, i.porcentaje_defectuoso, i.regla
  from public.inspecciones i
  where i.codigo_lote = l.codigo
  order by i.numero_inspeccion desc
  limit 1
) u on true;

alter table public.proveedores enable row level security;
alter table public.lotes enable row level security;
alter table public.inspecciones enable row level security;

revoke all on public.proveedores, public.lotes, public.inspecciones, public.v_lotes
  from anon, authenticated;