import { ETIQUETA_ESTADO, type EstadoLote as Estado } from "@/lib/reglas/decision";

const estilos: Record<Estado, string> = {
  pendiente: "border-[#cbd4e4] bg-[#edf1f8] text-[#3b4a6b]",
  en_revision: "border-[#efd89c] bg-[var(--amber-soft)] text-[var(--amber)]",
  aprobado: "border-[#b9dfc5] bg-[#e6f4eb] text-[#236840]",
  rechazado: "border-[#efc0ba] bg-[var(--coral-soft)] text-[var(--coral)]",
};

export function EstadoLote({ estado }: { estado: Estado }) {
  return <span className={`inline-flex min-h-7 items-center rounded border px-2.5 text-xs font-semibold ${estilos[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>;
}