create table public.proveedores (
  id bigint generated always as identity,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint pk_proveedores primary key (id),
  constraint ck_proveedores_nombre check (char_length(btrim(nombre)) between 2 and 80)
);

create unique index ux_proveedores_nombre
  on public.proveedores (lower(btrim(nombre)));

create table public.lotes (
  codigo text not null,
  producto text not null,
  fecha_produccion date not null,
  cantidad_producida integer not null,
  proveedor_id bigint not null,
  muestra_minima integer not null,
  estado text not null default 'pendiente',
  fecha_decision date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_lotes primary key (codigo),
  constraint fk_lotes_proveedor foreign key (proveedor_id) references public.proveedores (id),
  constraint ck_lotes_codigo check (codigo = upper(codigo) and codigo ~ '^[A-Z0-9][A-Z0-9-]{1,29}$'),
  constraint ck_lotes_producto check (char_length(btrim(producto)) between 2 and 100),
  constraint ck_lotes_cantidad check (cantidad_producida > 0),
  constraint ck_lotes_muestra check (muestra_minima between 1 and cantidad_producida),
  constraint ck_lotes_estado check (estado in ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
  constraint ck_lotes_decision check ((estado in ('aprobado', 'rechazado')) = (fecha_decision is not null))
);

create index ix_lotes_estado_creado on public.lotes (estado, created_at);
create index ix_lotes_proveedor_decision on public.lotes (proveedor_id, estado, fecha_decision);

create table public.inspecciones (
  id bigint generated always as identity,
  codigo_lote text not null,
  numero_inspeccion smallint not null,
  fecha_inspeccion date not null,
  piezas_muestreadas integer not null,
  piezas_defectuosas integer not null,
  piezas_criticas integer not null default 0,
  porcentaje_defectuoso numeric(5, 2) generated always as
    (round(piezas_defectuosas * 100.0 / piezas_muestreadas, 2)) stored,
  resultado text not null,
  regla text not null,
  observaciones text,
  created_at timestamptz not null default now(),
  constraint pk_inspecciones primary key (id),
  constraint fk_inspecciones_lote foreign key (codigo_lote)
    references public.lotes (codigo) on update cascade,
  constraint ux_inspecciones_lote_numero unique (codigo_lote, numero_inspeccion),
  constraint ck_inspecciones_numero check (numero_inspeccion in (1, 2)),
  constraint ck_inspecciones_muestreadas check (piezas_muestreadas > 0),
  constraint ck_inspecciones_defectuosas check (piezas_defectuosas between 0 and piezas_muestreadas),
  constraint ck_inspecciones_criticas check (piezas_criticas between 0 and piezas_defectuosas),
  constraint ck_inspecciones_resultado check (resultado in ('aprobado', 'en_revision', 'rechazado')),
  constraint ck_inspecciones_regla check (regla in ('R2', 'R3', 'R4', 'R5', 'R6')),
  constraint ck_inspecciones_segunda check (numero_inspeccion = 1 or resultado <> 'en_revision'),
  constraint ck_inspecciones_obs check (observaciones is null or char_length(observaciones) <= 500)
);

create index ix_inspecciones_lote on public.inspecciones (codigo_lote);