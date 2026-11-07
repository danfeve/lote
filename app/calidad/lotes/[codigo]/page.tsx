import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Package, Pencil, ClipboardCheck } from "lucide-react";
import { AccionesLote } from "@/components/calidad/AccionesLote";
import { AvisoConfiguracion } from "@/components/calidad/AvisoConfiguracion";
import { EstadoLote } from "@/components/calidad/EstadoLote";
import { obtenerDetalleLote } from "@/lib/dataService";
import { DESCRIPCION_REGLA, ETIQUETA_ESTADO } from "@/lib/reglas/decision";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { formatearFecha, formatearPorcentaje } from "@/lib/formato";
import { MAX_INSPECCIONES } from "@/lib/config/calidad";

type Propiedades = { params: Promise<{ codigo: string }> };

export default async function DetalleLotePage({ params }: Propiedades) {
  const { codigo } = await params;
  let detalle;
  try { detalle = await obtenerDetalleLote(codigo); }
  catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === "LOTE_NO_ENCONTRADO") {
      return <section className="surface p-6"><h1 className="text-2xl font-semibold">Lote no encontrado</h1><p className="mt-2 text-sm text-[var(--muted)]">Revise el código o vuelva al historial.</p><Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--forest)]" href="/calidad/lotes">Volver al historial</Link></section>;
    }
    return <div className="space-y-5"><Link href="/calidad/lotes" className="inline-flex min-h-9 items-center gap-2 text-sm text-[var(--muted)]"><ArrowLeft size={16} />Historial</Link><AvisoConfiguracion baseDeDatos={!process.env.DATABASE_URL} /></div>;
  }
  const { lote, inspecciones, acciones, siguienteNumeroInspeccion } = detalle;
  const ultima = inspecciones.at(-1);

  return (
    <div className="page-enter space-y-6">
      <Link href="/calidad/lotes" className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--forest)]"><ArrowLeft size={16} />Volver al historial</Link>
      <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-3xl font-semibold">{lote.codigo}</h1><EstadoLote estado={lote.estado} /></div><p className="mt-2 text-lg font-medium">{lote.producto}</p><p className="mt-1 text-sm text-[var(--muted)]">Proveedor: {lote.proveedorNombre}{!lote.proveedorActivo && " · Inactivo"}</p></div><div className="flex flex-wrap gap-2">{siguienteNumeroInspeccion && <Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}/inspeccion`} className="inline-flex min-h-11 items-center gap-2 rounded bg-[var(--forest)] px-4 text-sm font-semibold text-white"><ClipboardCheck size={16} />{siguienteNumeroInspeccion === 1 ? "Inspeccionar" : "Segunda inspección"}</Link>}{acciones.includes("EDITAR_LOTE") && <Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}/editar`} title="Editar lote" className="inline-flex min-h-11 items-center gap-2 rounded border border-[var(--line)] bg-white px-3 text-sm font-semibold"><Pencil size={15} />Editar</Link>}</div></header>
      <section className="surface grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-xs font-bold uppercase text-[var(--muted)]">Producción</span><p className="mt-2 inline-flex items-center gap-2 text-sm font-medium"><CalendarDays size={16} className="text-[var(--forest)]" />{formatearFecha(lote.fechaProduccion)}</p></div><div><span className="text-xs font-bold uppercase text-[var(--muted)]">Cantidad producida</span><p className="mt-2 inline-flex items-center gap-2 text-sm font-medium tabular-nums"><Package size={16} className="text-[var(--forest)]" />{lote.cantidadProducida.toLocaleString("es-CO")} piezas</p></div><div><span className="text-xs font-bold uppercase text-[var(--muted)]">Muestra mínima</span><p className="mt-2 text-sm font-semibold tabular-nums">{lote.muestraMinima} piezas</p></div><div><span className="text-xs font-bold uppercase text-[var(--muted)]">Inspecciones</span><p className="mt-2 text-sm font-semibold tabular-nums">{lote.totalInspecciones} de {MAX_INSPECCIONES}</p></div><p className="border-t border-[var(--line)] pt-3 text-sm leading-6 text-[var(--muted)] sm:col-span-2 lg:col-span-4">{detalle.explicacionMuestra}</p></section>
      {lote.fechaDecision && ultima && <section className={`surface border-l-4 p-5 ${lote.estado === "aprobado" ? "border-l-[#2b7c4c]" : "border-l-[var(--coral)]"}`}><p className="text-xs font-bold uppercase text-[var(--muted)]">Decisión final · {formatearFecha(lote.fechaDecision)}</p><div className="mt-2 flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{ETIQUETA_ESTADO[lote.estado]}</h2><EstadoLote estado={lote.estado} /></div><p className="mt-3 text-sm font-semibold">{DESCRIPCION_REGLA[ultima.regla]}</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{ultima.explicacion}</p></section>}
      <section className="space-y-3"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase text-[var(--forest)]">Trazabilidad</p><h2 className="mt-1 text-xl font-semibold">Inspecciones</h2></div><span className="text-sm tabular-nums text-[var(--muted)]">{inspecciones.length} registradas</span></div>{inspecciones.length === 0 ? <div className="surface px-5 py-9 text-center"><p className="font-medium">Este lote todavía no tiene inspecciones.</p><p className="mt-1 text-sm text-[var(--muted)]">La primera muestra debe incluir al menos {lote.muestraMinima} piezas.</p></div> : inspecciones.map((inspeccion) => <article key={inspeccion.numero} className="surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-[var(--forest)]">Inspección {inspeccion.numero} · {formatearFecha(inspeccion.fecha)}</p><h3 className="mt-2 text-lg font-semibold">{DESCRIPCION_REGLA[inspeccion.regla]}</h3></div><EstadoLote estado={inspeccion.resultado} /></div><div className="mt-4 grid gap-3 border-y border-[var(--line)] py-3 text-sm sm:grid-cols-4"><p><span className="block text-xs text-[var(--muted)]">Muestreadas</span><strong className="mt-1 block tabular-nums">{inspeccion.muestreadas}</strong></p><p><span className="block text-xs text-[var(--muted)]">Defectuosas</span><strong className="mt-1 block tabular-nums">{inspeccion.defectuosas}</strong></p><p><span className="block text-xs text-[var(--muted)]">Críticas</span><strong className="mt-1 block tabular-nums">{inspeccion.criticas}</strong></p><p><span className="block text-xs text-[var(--muted)]">Porcentaje</span><strong className="mt-1 block tabular-nums">{formatearPorcentaje(inspeccion.porcentaje)} %</strong></p></div><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{inspeccion.explicacion}</p>{inspeccion.observaciones && <p className="mt-3 border-t border-[var(--line)] pt-3 text-sm"><span className="font-semibold">Observaciones: </span>{inspeccion.observaciones}</p>}</article>)}</section>
      {acciones.includes("ELIMINAR_LOTE") && <div className="border-t border-[var(--line)] pt-4"><AccionesLote codigo={lote.codigo} /></div>}
      {!siguienteNumeroInspeccion && <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><ArrowRight size={15} />El lote está cerrado y no admite más inspecciones.</p>}
    </div>
  );
}