import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { AvisoConfiguracion } from "@/components/calidad/AvisoConfiguracion";
import { FormularioInspeccion } from "@/components/calidad/FormularioInspeccion";
import { EstadoLote } from "@/components/calidad/EstadoLote";
import { obtenerDetalleLote } from "@/lib/dataService";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import type { DetalleLote } from "@/lib/datos/tipos";

type Propiedades = { params: Promise<{ codigo: string }> };

export default async function InspeccionPage({ params }: Propiedades) {
  const { codigo } = await params;
  let detalle: DetalleLote | null = null;
  let noEncontrado = false;
  let falloServidor = false;
  try { detalle = await obtenerDetalleLote(codigo); }
  catch (error) {
    noEncontrado = error instanceof ErrorDeNegocio && error.codigo === "LOTE_NO_ENCONTRADO";
    falloServidor = !noEncontrado;
  }
  if (noEncontrado) return <section className="surface p-6"><h1 className="text-2xl font-semibold">Lote no encontrado</h1><Link href="/calidad/lotes" className="mt-4 inline-flex min-h-10 text-sm font-semibold text-[var(--forest)]">Volver al historial</Link></section>;
  if (falloServidor || !detalle) return <AvisoConfiguracion baseDeDatos={!process.env.DATABASE_URL} />;
  if (!detalle.siguienteNumeroInspeccion) {
    return <section className="surface mx-auto max-w-[700px] p-6 sm:p-8"><div className="flex size-11 items-center justify-center rounded bg-[#f1f3f1] text-[var(--muted)]"><LockKeyhole size={20} /></div><p className="mt-5 text-xs font-bold uppercase text-[var(--muted)]">Inspección no disponible</p><h1 className="mt-2 text-2xl font-semibold">El lote está cerrado</h1><div className="mt-3"><EstadoLote estado={detalle.lote.estado} /></div><p className="mt-3 text-sm leading-6 text-[var(--muted)]">El lote ya tiene una decisión final y no admite más inspecciones.</p><Link href={`/calidad/lotes/${encodeURIComponent(detalle.lote.codigo)}`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded bg-[var(--forest)] px-3 text-sm font-semibold text-white"><ArrowLeft size={15} />Ver detalle del lote</Link></section>;
  }
  return <FormularioInspeccion detalle={detalle} />;
}