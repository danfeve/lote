import Link from "next/link";
import { ArrowRight, ClipboardList, RefreshCw } from "lucide-react";
import { AvisoConfiguracion } from "@/components/calidad/AvisoConfiguracion";
import { EstadoLote } from "@/components/calidad/EstadoLote";
import { listarBandeja } from "@/lib/dataService";
import type { FilaLote } from "@/lib/datos/tipos";

function TablaTrabajo({ titulo, descripcion, lotes, revision = false }: { titulo: string; descripcion: string; lotes: FilaLote[]; revision?: boolean }) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] px-4 py-4 sm:px-5"><div><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-sm text-[var(--muted)]">{descripcion}</p></div><span className="rounded bg-[#f1f4f0] px-2.5 py-1 text-xs font-semibold tabular-nums text-[var(--muted)]">{lotes.length} {lotes.length === 1 ? "lote" : "lotes"}</span></div>
      {lotes.length === 0 ? <div className="px-5 py-10 text-center"><ClipboardList className="mx-auto text-[#8b9b92]" size={24} aria-hidden="true" /><p className="mt-3 text-sm font-medium">No hay lotes en esta sección.</p><p className="mt-1 text-sm text-[var(--muted)]">Los nuevos lotes aparecerán aquí.</p></div> : (
        <div className="table-scroll"><table><thead><tr><th>Código / lote</th><th>Producto</th><th>Proveedor</th><th>Producción</th><th>Inspección</th><th>Estado</th><th /></tr></thead><tbody>
          {lotes.map((lote) => <tr key={lote.codigo}>
            <td data-label="Código / lote"><Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`} className="font-mono text-sm font-bold text-[var(--forest)] underline-offset-4 hover:underline">{lote.codigo}</Link></td>
            <td data-label="Producto" className="text-sm">{lote.producto}</td><td data-label="Proveedor" className="text-sm">{lote.proveedorNombre}</td>
            <td data-label="Producción" className="text-sm tabular-nums">{lote.cantidadProducida.toLocaleString("es-CO")}</td>
            <td data-label="Inspección" className="text-sm">{revision && lote.ultima ? `${lote.ultima.defectuosas} de ${lote.ultima.muestreadas} · ${lote.ultima.porcentaje.toFixed(2).replace(".", ",")} %` : `${lote.muestraMinima} piezas mín.`}</td>
            <td data-label="Estado"><EstadoLote estado={lote.estado} /></td>
            <td data-label="Acción"><Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}/inspeccion`} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded px-2 text-sm font-semibold text-[var(--forest)] hover:bg-[var(--lime-soft)]">{revision ? <RefreshCw size={15} /> : <ArrowRight size={15} />}{revision ? "Segunda inspección" : "Inspeccionar"}</Link></td>
          </tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export default async function BandejaPage() {
  let lotes: FilaLote[] = [];
  let error = false;
  try { lotes = await listarBandeja(); } catch { error = true; }
  const pendientes = lotes.filter((lote) => lote.estado === "pendiente");
  const revision = lotes.filter((lote) => lote.estado === "en_revision");
  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[var(--forest)]">Operación diaria</p><h1 className="mt-2 text-3xl font-semibold tracking-normal">Bandeja de trabajo</h1><p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Lotes que requieren revisión de calidad.</p></div><Link href="/calidad/lotes" className="inline-flex min-h-10 items-center gap-2 rounded border border-[var(--line)] bg-white px-3 text-sm font-semibold hover:bg-[#f8faf7]">Historial completo <ArrowRight size={16} aria-hidden="true" /></Link></div>
      {error && <AvisoConfiguracion baseDeDatos={!process.env.DATABASE_URL} />}
      <div className="grid gap-3 sm:grid-cols-2"><div className="surface flex items-center justify-between p-4"><div><p className="text-sm text-[var(--muted)]">Pendientes de inspección</p><p className="mt-1 text-2xl font-semibold tabular-nums">{pendientes.length}</p></div><span className="flex size-10 items-center justify-center rounded bg-[#edf1f8] text-[#3b4a6b]"><ClipboardList size={19} /></span></div><div className="surface flex items-center justify-between p-4"><div><p className="text-sm text-[var(--muted)]">Requieren segunda inspección</p><p className="mt-1 text-2xl font-semibold tabular-nums">{revision.length}</p></div><span className="flex size-10 items-center justify-center rounded bg-[var(--amber-soft)] text-[var(--amber)]"><RefreshCw size={19} /></span></div></div>
      <TablaTrabajo titulo="Pendientes de inspección" descripcion="Ordenados desde el lote más antiguo." lotes={pendientes} />
      <TablaTrabajo titulo="En revisión · requieren segunda inspección" descripcion="Use una muestra nueva para confirmar la decisión." lotes={revision} revision />
    </div>
  );
}