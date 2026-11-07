"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, ClipboardCheck, X } from "lucide-react";
import { EstadoLote } from "@/components/calidad/EstadoLote";
import {
  MAX_INSPECCIONES,
  MAX_OBSERVACIONES,
  UMBRAL_APROBACION_PCT,
  UMBRAL_REVISION_PCT,
} from "@/lib/config/calidad";
import { DESCRIPCION_REGLA, calcularPorcentaje, decidirResultado } from "@/lib/reglas/decision";
import { formatearPorcentaje } from "@/lib/formato";
import { validarInspeccion } from "@/lib/reglas/inspeccion";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { explicarMuestraMinima } from "@/lib/reglas/muestra";
import type { DetalleLote, ResultadoRegistroInspeccion } from "@/lib/datos/tipos";

export function FormularioInspeccion({ detalle }: { detalle: DetalleLote }) {
  const router = useRouter();
  const { lote } = detalle;
  const numero = detalle.siguienteNumeroInspeccion;
  const [muestreadas, setMuestreadas] = useState(String(lote.muestraMinima));
  const [defectuosas, setDefectuosas] = useState("0");
  const [criticas, setCriticas] = useState("0");
  const [observaciones, setObservaciones] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRegistroInspeccion | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const datos = {
    piezasMuestreadas: Number(muestreadas),
    piezasDefectuosas: Number(defectuosas),
    piezasCriticas: Number(criticas),
  };
  let decision: ReturnType<typeof decidirResultado> | null = null;
  let errorVistaPrevia = "";
  if (numero && Object.values(datos).every((valor) => Number.isInteger(valor) && valor >= 0)) {
    try {
      validarInspeccion({ cantidadProducida: lote.cantidadProducida, muestraMinima: lote.muestraMinima }, datos);
      decision = decidirResultado({ numeroInspeccion: numero, ...datos });
    } catch (fallo) {
      if (fallo instanceof ErrorDeNegocio) errorVistaPrevia = fallo.message;
      else errorVistaPrevia = "Revise los valores de la muestra.";
    }
  }

  async function registrar() {
    if (!decision || !numero) return;
    setGuardando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/calidad/lotes/${encodeURIComponent(lote.codigo)}/inspecciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, observaciones }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo registrar la inspección.");
      setResultado(cuerpo.datos);
      setConfirmar(false);
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo registrar la inspección.");
      setConfirmar(false);
    } finally { setGuardando(false); }
  }

  if (resultado) {
    return <section className="surface mx-auto max-w-[760px] border-t-4 border-t-[var(--forest)] p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded bg-[var(--lime-soft)] text-[var(--forest)]"><Check size={23} /></div>
      <p className="mt-5 text-xs font-bold uppercase text-[var(--forest)]">Inspección {resultado.numeroInspeccion} registrada</p>
      <h1 className="mt-2 text-3xl font-semibold">{resultado.estado === "en_revision" ? "En revisión" : resultado.estado === "aprobado" ? "Aprobado" : "Rechazado"}</h1>
      <div className="mt-4"><EstadoLote estado={resultado.estado} /></div>
      <p className="mt-5 text-sm font-semibold">{DESCRIPCION_REGLA[resultado.regla]}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{resultado.explicacion}</p>
      <div className="mt-5 grid gap-3 border-y border-[var(--line)] py-4 text-sm sm:grid-cols-3"><p><span className="block text-xs text-[var(--muted)]">Muestra</span><strong className="mt-1 block tabular-nums">{resultado.muestreadas} piezas</strong></p><p><span className="block text-xs text-[var(--muted)]">Defectuosas</span><strong className="mt-1 block tabular-nums">{resultado.defectuosas} · {formatearPorcentaje(resultado.porcentaje)} %</strong></p><p><span className="block text-xs text-[var(--muted)]">Críticas</span><strong className="mt-1 block tabular-nums">{resultado.criticas}</strong></p></div>
      <div className="mt-6 flex flex-wrap gap-3"><Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`} className="inline-flex min-h-10 items-center rounded bg-[var(--forest)] px-3 text-sm font-semibold text-white">Ver lote</Link><Link href="/calidad" className="inline-flex min-h-10 items-center rounded border border-[var(--line)] px-3 text-sm font-semibold">Volver a la bandeja</Link>{resultado.estado === "en_revision" && <Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}/inspeccion`} className="inline-flex min-h-10 items-center rounded border border-[var(--line)] px-3 text-sm font-semibold">Registrar segunda inspección</Link>}</div>
    </section>;
  }

  return <div className="mx-auto max-w-[900px] page-enter space-y-5">
    <Link href={`/calidad/lotes/${encodeURIComponent(lote.codigo)}`} className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--forest)]"><ArrowLeft size={16} />Volver al lote</Link>
    <div><p className="text-xs font-bold uppercase text-[var(--forest)]">Control de muestra</p><h1 className="mt-2 text-3xl font-semibold">Inspección {numero} de {MAX_INSPECCIONES}</h1><p className="mt-2 text-sm text-[var(--muted)]">Registre las piezas revisadas para obtener una decisión trazable.</p></div>
    <section className="surface grid gap-4 p-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-[var(--muted)]">Lote</p><p className="mt-1 font-mono text-lg font-bold">{lote.codigo}</p><p className="mt-1 text-sm">{lote.producto}</p></div><div className="sm:text-right"><p className="text-xs font-bold uppercase text-[var(--muted)]">Proveedor</p><p className="mt-1 font-medium">{lote.proveedorNombre}</p><p className="mt-1 text-sm text-[var(--muted)]">{lote.cantidadProducida.toLocaleString("es-CO")} piezas · mínimo {lote.muestraMinima}</p></div><p className="border-t border-[var(--line)] pt-3 text-sm leading-6 text-[var(--muted)] sm:col-span-2">{explicarMuestraMinima(lote.cantidadProducida)}</p></section>
    {numero === MAX_INSPECCIONES && <section className="rounded border border-[#efd89c] bg-[var(--amber-soft)] p-4"><p className="font-semibold text-[var(--amber)]">Use una muestra nueva. Si el resultado vuelve a quedar entre {UMBRAL_APROBACION_PCT} % y {UMBRAL_REVISION_PCT} %, el lote se rechaza.</p>{detalle.inspecciones[0] && <p className="mt-2 text-sm text-[#705313]">Primera inspección: {detalle.inspecciones[0].defectuosas} de {detalle.inspecciones[0].muestreadas} · {formatearPorcentaje(detalle.inspecciones[0].porcentaje)} %.</p>}</section>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
      <form onSubmit={(evento) => { evento.preventDefault(); setConfirmar(true); }} className="surface space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3"><div><label htmlFor="muestreadas" className="text-sm font-semibold">Piezas muestreadas</label><input id="muestreadas" className="field mt-2 tabular-nums" type="number" min={lote.muestraMinima} max={lote.cantidadProducida} step="1" required value={muestreadas} onChange={(evento) => setMuestreadas(evento.target.value)} /><p className="mt-1 text-xs text-[var(--muted)]">Mínimo {lote.muestraMinima} · máximo {lote.cantidadProducida}</p></div><div><label htmlFor="defectuosas" className="text-sm font-semibold">Defectuosas</label><input id="defectuosas" className="field mt-2 tabular-nums" type="number" min="0" max={muestreadas || lote.cantidadProducida} step="1" required value={defectuosas} onChange={(evento) => setDefectuosas(evento.target.value)} /></div><div><label htmlFor="criticas" className="text-sm font-semibold">Críticas</label><input id="criticas" className="field mt-2 tabular-nums" type="number" min="0" max={defectuosas || 0} step="1" required value={criticas} onChange={(evento) => setCriticas(evento.target.value)} /><p className="mt-1 text-xs text-[var(--muted)]">Toda pieza crítica también cuenta como defectuosa.</p></div></div>
        <div><div className="flex items-center justify-between"><label htmlFor="observaciones" className="text-sm font-semibold">Observaciones</label><span className="text-xs tabular-nums text-[var(--muted)]">{observaciones.length}/{MAX_OBSERVACIONES}</span></div><textarea id="observaciones" className="field mt-2 min-h-24 resize-y" maxLength={MAX_OBSERVACIONES} value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} /></div>
        {errorVistaPrevia && <p className="rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{errorVistaPrevia}</p>}
        {error && <p className="rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{error}</p>}
        <button type="submit" disabled={!decision || guardando} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[var(--forest)] px-4 font-semibold text-white hover:bg-[var(--forest-deep)] disabled:cursor-not-allowed disabled:opacity-45"><ClipboardCheck size={17} />Revisar y registrar</button>
      </form>
      <aside className="surface h-fit overflow-hidden"><div className="border-b border-[var(--line)] px-4 py-4"><p className="text-xs font-bold uppercase text-[var(--forest)]">Vista previa</p><h2 className="mt-1 font-semibold">Resultado previsto</h2><p className="mt-1 text-xs text-[var(--muted)]">Se confirma al registrar la inspección.</p></div>{decision ? <div className="p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm tabular-nums">{datos.piezasDefectuosas} / {datos.piezasMuestreadas} · {formatearPorcentaje(calcularPorcentaje(datos.piezasDefectuosas, datos.piezasMuestreadas))} %</span><EstadoLote estado={decision.estado} /></div><p className="mt-4 text-sm font-semibold">{DESCRIPCION_REGLA[decision.regla]}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{decision.explicacion}</p></div> : <p className="p-4 text-sm text-[var(--muted)]">Complete una muestra válida para ver la decisión.</p>}</aside>
    </div>
    {confirmar && decision && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo" className="surface w-full max-w-lg p-5 shadow-xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="confirmar-titulo" className="text-lg font-semibold">Confirmar inspección</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Al confirmar, la inspección queda registrada y no se podrá editar ni eliminar. El estado del lote se actualizará según el resultado.</p></div><button type="button" title="Cerrar" onClick={() => setConfirmar(false)} className="flex size-9 shrink-0 items-center justify-center rounded hover:bg-[#eff2ef]"><X size={18} /></button></div><div className="my-5 rounded bg-[#f3f5f2] p-4"><p className="font-mono font-bold">{lote.codigo} · Inspección {numero}</p><p className="mt-2 text-sm">{datos.piezasDefectuosas} defectuosas / {datos.piezasMuestreadas} muestreadas · {formatearPorcentaje(calcularPorcentaje(datos.piezasDefectuosas, datos.piezasMuestreadas))} %</p><p className="mt-2 text-sm font-semibold">{DESCRIPCION_REGLA[decision.regla]}</p><p className="mt-1 text-sm text-[var(--muted)]">{decision.explicacion}</p></div><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setConfirmar(false)} className="min-h-11 rounded border border-[var(--line)] px-4 text-sm font-semibold">Revisar de nuevo</button><button type="button" onClick={() => void registrar()} disabled={guardando} className="inline-flex min-h-11 items-center gap-2 rounded bg-[var(--forest)] px-4 text-sm font-semibold text-white disabled:opacity-50"><Check size={16} />{guardando ? "Registrando…" : "Confirmar"}</button></div></section></div>}
  </div>;
}