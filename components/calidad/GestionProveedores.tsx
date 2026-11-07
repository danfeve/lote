"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import type { FilaProveedor } from "@/lib/datos/tipos";

export function GestionProveedores() {
  const [proveedores, setProveedores] = useState<FilaProveedor[]>([]);
  const [nombre, setNombre] = useState("");
  const [renombrando, setRenombrando] = useState<FilaProveedor | null>(null);
  const [nombreEdicion, setNombreEdicion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      const respuesta = await fetch("/api/calidad/proveedores?incluirInactivos=true", { cache: "no-store" });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo cargar la lista.");
      setProveedores(cuerpo.datos);
      setError("");
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo cargar la lista."); }
    finally { setCargando(false); }
  }

  useEffect(() => {
    let activa = true;
    fetch("/api/calidad/proveedores?incluirInactivos=true", { cache: "no-store" })
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo cargar la lista.");
        if (activa) setProveedores(cuerpo.datos);
      })
      .catch((fallo: unknown) => {
        if (activa) setError(fallo instanceof Error ? fallo.message : "No se pudo cargar la lista.");
      })
      .finally(() => { if (activa) setCargando(false); });
    return () => { activa = false; };
  }, []);

  async function enviar(url: string, method: string, body: unknown) {
    const respuesta = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo guardar el proveedor.");
    return cuerpo.datos as FilaProveedor;
  }

  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError("");
    try { await enviar("/api/calidad/proveedores", "POST", { nombre }); setNombre(""); await cargar(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo crear el proveedor."); }
  }

  async function actualizar(proveedor: FilaProveedor, cambios: { nombre?: string; activo?: boolean }) {
    setError("");
    try { await enviar(`/api/calidad/proveedores/${proveedor.id}`, "PATCH", cambios); setRenombrando(null); await cargar(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo actualizar el proveedor."); }
  }

  return (
    <div className="page-enter space-y-6">
      <div><p className="text-xs font-bold uppercase text-[var(--forest)]">Abastecimiento</p><h1 className="mt-2 text-3xl font-semibold">Proveedores</h1><p className="mt-2 text-sm text-[var(--muted)]">Administre proveedores de materia prima. Los registros no se eliminan; se pueden desactivar.</p></div>
      <form onSubmit={agregar} className="surface grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><label className="text-xs font-bold uppercase text-[var(--muted)]" htmlFor="nuevo-proveedor">Nuevo proveedor</label><input id="nuevo-proveedor" className="field mt-2" minLength={2} maxLength={80} required placeholder="Nombre del proveedor" value={nombre} onChange={(evento) => setNombre(evento.target.value)} /></div><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[var(--forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--forest-deep)]"><Plus size={16} />Agregar proveedor</button></form>
      {error && <p className="rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{error}</p>}
      <section className="surface overflow-hidden"><div className="border-b border-[var(--line)] px-4 py-4"><h2 className="font-semibold">Directorio de proveedores</h2></div>{!cargando && proveedores.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[var(--muted)]">Todavía no hay proveedores registrados.</p> : <div className="table-scroll"><table><thead><tr><th>Proveedor</th><th>Estado</th><th>Lotes registrados</th><th>Acciones</th></tr></thead><tbody>{proveedores.map((proveedor) => <tr key={proveedor.id}><td data-label="Proveedor" className="font-medium">{proveedor.nombre}</td><td data-label="Estado"><span className={`inline-flex min-h-7 items-center rounded border px-2.5 text-xs font-semibold ${proveedor.activo ? "border-[#b9dfc5] bg-[#e6f4eb] text-[#236840]" : "border-[var(--line)] bg-[#f1f3f1] text-[var(--muted)]"}`}>{proveedor.activo ? "Activo" : "Inactivo"}</span></td><td data-label="Lotes registrados" className="tabular-nums">{proveedor.totalLotes}</td><td data-label="Acciones"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setRenombrando(proveedor); setNombreEdicion(proveedor.nombre); }} title="Renombrar proveedor" className="inline-flex min-h-9 items-center gap-1.5 rounded border border-[var(--line)] px-2.5 text-sm hover:bg-[#f5f7f4]"><Pencil size={14} />Renombrar</button><button type="button" onClick={() => void actualizar(proveedor, { activo: !proveedor.activo })} className="inline-flex min-h-9 items-center gap-1.5 rounded border border-[var(--line)] px-2.5 text-sm hover:bg-[#f5f7f4]">{proveedor.activo ? <X size={14} /> : <Check size={14} />}{proveedor.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}</tbody></table></div>}</section>
      {renombrando && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form role="dialog" aria-modal="true" aria-labelledby="titulo-renombrar" onSubmit={(evento) => { evento.preventDefault(); void actualizar(renombrando, { nombre: nombreEdicion }); }} className="surface w-full max-w-md p-5 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="titulo-renombrar" className="text-lg font-semibold">Renombrar proveedor</h2><p className="mt-1 text-sm text-[var(--muted)]">Los lotes existentes conservarán su vínculo.</p></div><button type="button" title="Cerrar" onClick={() => setRenombrando(null)} className="flex size-9 items-center justify-center rounded hover:bg-[#eff2ef]"><X size={18} /></button></div><label htmlFor="nombre-edicion" className="mt-5 block text-sm font-semibold">Nombre</label><input id="nombre-edicion" className="field mt-2" minLength={2} maxLength={80} required value={nombreEdicion} onChange={(evento) => setNombreEdicion(evento.target.value)} /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRenombrando(null)} className="min-h-10 rounded border border-[var(--line)] px-3 text-sm">Cancelar</button><button type="submit" className="min-h-10 rounded bg-[var(--forest)] px-3 text-sm font-semibold text-white">Guardar cambios</button></div></form></div>}
    </div>
  );
}