"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { EstadoLote } from "@/components/calidad/EstadoLote";
import { LIMITE_HISTORIAL, MAX_INSPECCIONES } from "@/lib/config/calidad";
import type { FilaLote, FilaProveedor } from "@/lib/datos/tipos";

export function HistorialLotes() {
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [lotes, setLotes] = useState<FilaLote[]>([]);
  const [proveedores, setProveedores] = useState<FilaProveedor[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/calidad/proveedores?incluirInactivos=true", { cache: "no-store" })
      .then((respuesta) => respuesta.json())
      .then((cuerpo) => { if (cuerpo.ok) setProveedores(cuerpo.datos); });
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setError("");
      const parametros = new URLSearchParams();
      if (codigo.trim()) parametros.set("codigo", codigo.trim());
      if (estado) parametros.set("estado", estado);
      if (proveedorId) parametros.set("proveedorId", proveedorId);
      const cadena = parametros.toString();
      window.history.replaceState(null, "", cadena ? `?${cadena}` : window.location.pathname);
      try {
        const respuesta = await fetch(`/api/calidad/lotes${cadena ? `?${cadena}` : ""}`, { cache: "no-store" });
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo cargar el historial.");
        setLotes(cuerpo.datos);
      } catch (fallo) {
        setError(fallo instanceof Error ? fallo.message : "No se pudo cargar el historial.");
        setLotes([]);
      } finally { setCargando(false); }
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [codigo, estado, proveedorId]);

  return (
    <div className="page-enter space-y-6">
      <div><p className="text-xs font-bold uppercase text-[var(--forest)]">Trazabilidad</p><h1 className="mt-2 text-3xl font-semibold">Historial de lotes</h1><p className="mt-2 text-sm text-[var(--muted)]">Consulte decisiones e inspecciones registradas.</p></div>
      <section className="surface grid gap-4 p-4 sm:grid-cols-[minmax(190px,1fr)_190px_minmax(220px,1fr)] sm:items-end">
        <div><label htmlFor="filtro-codigo" className="text-xs font-bold uppercase text-[var(--muted)]">Código</label><div className="relative mt-2"><Search size={16} className="absolute left-3 top-3.5 text-[var(--muted)]" /><input id="filtro-codigo" className="field pl-9" placeholder="Buscar código" value={codigo} onChange={(evento) => setCodigo(evento.target.value)} /></div></div>
        <div><label htmlFor="filtro-estado" className="text-xs font-bold uppercase text-[var(--muted)]">Estado</label><select id="filtro-estado" className="field mt-2" value={estado} onChange={(evento) => setEstado(evento.target.value)}><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="en_revision">En revisión</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option></select></div>
        <div><label htmlFor="filtro-proveedor" className="text-xs font-bold uppercase text-[var(--muted)]">Proveedor</label><select id="filtro-proveedor" className="field mt-2" value={proveedorId} onChange={(evento) => setProveedorId(evento.target.value)}><option value="">Todos</option>{proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}{proveedor.activo ? "" : " · Inactivo"}</option>)}</select></div>
      </section>
      {error && <p className="rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{error}</p>}
      <section className="surface overflow-hidden"><div className="flex justify-between border-b border-[var(--line)] px-4 py-4"><h2 className="font-semibold">Lotes</h2><span className="text-sm text-[var(--muted)]">{cargando ? "Actualizando…" : `${lotes.length} resultados`}</span></div>{lotes.length === 0 && !cargando ? <div className="px-5 py-12 text-center"><p className="font-medium">No hay lotes que coincidan con los filtros.</p></div> : <div className="table-scroll"><table><thead><tr><th>Código</th><th>Producto</th><th>Proveedor</th><th>Producción</th><th>Última inspección</th><th>Inspecciones</th><th>Estado</th><th /></tr></thead><tbody>{lotes.map((lote) => <tr key={lote.codigo}><td data-label="Código"><Link className="font-mono font-bold text-[var(--forest)] hover:underline" href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`}>{lote.codigo}</Link></td><td data-label="Producto" className="text-sm">{lote.producto}</td><td data-label="Proveedor" className="text-sm">{lote.proveedorNombre}{!lote.proveedorActivo && <span className="ml-1 text-xs text-[var(--muted)]">(inactivo)</span>}</td><td data-label="Producción" className="text-sm tabular-nums">{lote.fechaProduccion}</td><td data-label="Última inspección" className="text-sm tabular-nums">{lote.ultima ? `${lote.ultima.defectuosas}/${lote.ultima.muestreadas} · ${lote.ultima.porcentaje.toFixed(2).replace(".", ",")} %` : "Sin inspección"}</td><td data-label="Inspecciones" className="text-sm tabular-nums">{lote.totalInspecciones} de {MAX_INSPECCIONES}</td><td data-label="Estado"><EstadoLote estado={lote.estado} /></td><td data-label="Detalle"><Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`} title={`Ver lote ${lote.codigo}`} className="inline-flex min-h-9 items-center justify-center rounded px-2 text-[var(--forest)] hover:bg-[var(--lime-soft)]"><ArrowUpRight size={17} /></Link></td></tr>)}</tbody></table></div>}{lotes.length === LIMITE_HISTORIAL && <p className="border-t border-[var(--line)] bg-[#fff8e6] px-4 py-3 text-sm text-[#705313]">Se muestran los {LIMITE_HISTORIAL} lotes más recientes. Ajuste los filtros para encontrar registros anteriores.</p>}</section>
    </div>
  );
}