import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioLote } from "@/components/calidad/FormularioLote";
import { AvisoConfiguracion } from "@/components/calidad/AvisoConfiguracion";
import { obtenerDetalleLote } from "@/lib/dataService";
import { hoyBogota } from "@/lib/reglas/fechas";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import type { DetalleLote } from "@/lib/datos/tipos";

type Propiedades = { params: Promise<{ codigo: string }> };

export default async function EditarLotePage({ params }: Propiedades) {
  const { codigo } = await params;
  let lote: DetalleLote["lote"] | null = null;
  let noEncontrado = false;
  let falloServidor = false;
  try { lote = (await obtenerDetalleLote(codigo)).lote; }
  catch (error) {
    noEncontrado = error instanceof ErrorDeNegocio && error.codigo === "LOTE_NO_ENCONTRADO";
    falloServidor = !noEncontrado;
  }
  if (noEncontrado) return <section className="surface p-6"><h1 className="text-2xl font-semibold">Lote no encontrado</h1><Link href="/calidad/lotes" className="mt-4 inline-flex min-h-10 text-sm font-semibold text-[var(--forest)]">Volver al historial</Link></section>;
  if (falloServidor || !lote) return <AvisoConfiguracion baseDeDatos={!process.env.DATABASE_URL} />;
  if (lote.estado !== "pendiente" || lote.totalInspecciones !== 0) {
    return <section className="surface p-6"><h1 className="text-2xl font-semibold">Lote no modificable</h1><p className="mt-2 text-sm text-[var(--muted)]">Solo se pueden editar lotes pendientes sin inspecciones.</p><Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--forest)]"><ArrowLeft size={15} className="mr-2" />Volver al lote</Link></section>;
  }
  return <FormularioLote hoy={hoyBogota()} inicial={{ codigo: lote.codigo, producto: lote.producto, fechaProduccion: lote.fechaProduccion, cantidadProducida: lote.cantidadProducida, proveedorId: lote.proveedorId }} />;
}