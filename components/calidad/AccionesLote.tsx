"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function AccionesLote({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState(false);

  async function eliminar() {
    if (!window.confirm("¿Eliminar este lote? Esta acción no se puede deshacer.")) return;
    setError("");
    setEliminando(true);
    try {
      const respuesta = await fetch(`/api/calidad/lotes/${encodeURIComponent(codigo)}`, { method: "DELETE" });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo eliminar el lote.");
      router.replace("/calidad/lotes");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo eliminar el lote.");
    } finally { setEliminando(false); }
  }

  return <div className="space-y-2">{error && <p role="alert" className="text-sm text-[var(--coral)]">{error}</p>}<div className="flex flex-wrap gap-2"><button type="button" onClick={eliminar} disabled={eliminando} className="inline-flex min-h-10 items-center gap-2 rounded border border-[#efc0ba] bg-white px-3 text-sm font-semibold text-[var(--coral)] hover:bg-[var(--coral-soft)] disabled:opacity-50"><Trash2 size={15} />{eliminando ? "Eliminando…" : "Eliminar lote"}</button></div></div>;
}