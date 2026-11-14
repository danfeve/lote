"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { explicarMuestraMinima } from "@/lib/reglas/muestra";
import type { FilaProveedor } from "@/lib/datos/tipos";
import { VisualizadorDimensiones } from "@/components/calidad/VisualizadorDimensiones";

export interface ValoresLote {
  codigo: string;
  producto: string;
  fechaProduccion: string;
  cantidadProducida: number;
  proveedorId: number;
  largoPiezaMm?: number | null;
  anchoPiezaMm?: number | null;
  altoPiezaMm?: number | null;
}

export function FormularioLote({
  hoy,
  inicial,
}: {
  hoy: string;
  inicial?: ValoresLote;
}) {
  const router = useRouter();
  const editar = Boolean(inicial);
  const [codigo, setCodigo] = useState(inicial?.codigo ?? "");
  const [producto, setProducto] = useState(inicial?.producto ?? "");
  const [fechaProduccion, setFechaProduccion] = useState(inicial?.fechaProduccion ?? hoy);
  const [cantidad, setCantidad] = useState(String(inicial?.cantidadProducida ?? ""));
  const [largoPiezaMm, setLargoPiezaMm] = useState(String(inicial?.largoPiezaMm ?? ""));
  const [anchoPiezaMm, setAnchoPiezaMm] = useState(String(inicial?.anchoPiezaMm ?? ""));
  const [altoPiezaMm, setAltoPiezaMm] = useState(String(inicial?.altoPiezaMm ?? ""));
  const [proveedorId, setProveedorId] = useState(String(inicial?.proveedorId ?? ""));
  const [proveedores, setProveedores] = useState<FilaProveedor[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modalProveedor, setModalProveedor] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");

  useEffect(() => {
    fetch("/api/calidad/proveedores?incluirInactivos=true", { cache: "no-store" })
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudieron cargar los proveedores.");
        setProveedores(cuerpo.datos);
      })
      .catch((fallo: unknown) => setError(fallo instanceof Error ? fallo.message : "No se pudieron cargar los proveedores."));
  }, []);

  const cantidadNumerica = Number(cantidad);
  const medidasCompletas = [largoPiezaMm, anchoPiezaMm, altoPiezaMm].every(
    (medida) => medida.trim() !== "" && Number.isFinite(Number(medida)) && Number(medida) > 0,
  );
  const muestra = Number.isInteger(cantidadNumerica) && cantidadNumerica > 0
    ? explicarMuestraMinima(cantidadNumerica)
    : "Ingrese una cantidad producida para calcular la muestra mínima.";

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    const medidas = [largoPiezaMm, anchoPiezaMm, altoPiezaMm];
    const medidasCompletas = medidas.every((medida) => medida.trim() !== "");
    const sinMedidas = medidas.every((medida) => medida.trim() === "");
    if (!medidasCompletas && !sinMedidas) {
      setError("Ingrese el largo, el ancho y el alto de cada pieza, o deje las tres medidas vacías.");
      return;
    }
    setCargando(true);
    try {
      const datos = {
        codigo,
        producto,
        fechaProduccion,
        cantidadProducida: Number(cantidad),
        largoPiezaMm: medidasCompletas ? Number(largoPiezaMm) : undefined,
        anchoPiezaMm: medidasCompletas ? Number(anchoPiezaMm) : undefined,
        altoPiezaMm: medidasCompletas ? Number(altoPiezaMm) : undefined,
        proveedorId: Number(proveedorId),
      };
      const destino = editar ? `/api/calidad/lotes/${encodeURIComponent(inicial!.codigo)}` : "/api/calidad/lotes";
      const respuesta = await fetch(destino, {
        method: editar ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo guardar el lote.");
      router.push(`/calidad/lotes/${encodeURIComponent(cuerpo.datos.codigo)}`);
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el lote.");
    } finally { setCargando(false); }
  }

  async function crearProveedor(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    try {
      const respuesta = await fetch("/api/calidad/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreNuevo }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No se pudo crear el proveedor.");
      setProveedores((actuales) => [...actuales, cuerpo.datos].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setProveedorId(String(cuerpo.datos.id));
      setNombreNuevo("");
      setModalProveedor(false);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo crear el proveedor.");
    }
  }

  const proveedoresDisponibles = proveedores.filter((proveedor) => proveedor.activo || proveedor.id === inicial?.proveedorId);

  return (
    <div className="mx-auto max-w-[760px] page-enter">
      <Link href={editar ? `/calidad/lotes/${encodeURIComponent(inicial!.codigo)}` : "/calidad"} className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--forest)]"><ArrowLeft size={16} />Volver</Link>
      <div className="mt-5"><p className="text-xs font-bold uppercase text-[var(--forest)]">Datos de producción</p><h1 className="mt-2 text-3xl font-semibold">{editar ? "Editar lote" : "Registrar lote"}</h1><p className="mt-2 text-sm text-[var(--muted)]">Complete los datos del lote y verifique la muestra mínima antes de guardarlo.</p></div>
      <form onSubmit={guardar} className="surface mt-6 space-y-5 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="block text-sm font-semibold" htmlFor="codigo">Código del lote</label><input id="codigo" className="field mt-2 font-mono uppercase" minLength={2} maxLength={30} pattern="[A-Za-z0-9][A-Za-z0-9-]{1,29}" required value={codigo} onChange={(evento) => setCodigo(evento.target.value.toUpperCase())} /></div>
          <div><label className="block text-sm font-semibold" htmlFor="producto">Producto</label><input id="producto" className="field mt-2" minLength={2} maxLength={100} required value={producto} onChange={(evento) => setProducto(evento.target.value)} /></div>
          <div><label className="block text-sm font-semibold" htmlFor="fecha">Fecha de producción</label><input id="fecha" className="field mt-2" type="date" max={hoy} required value={fechaProduccion} onChange={(evento) => setFechaProduccion(evento.target.value)} /></div>
          <div><label className="block text-sm font-semibold" htmlFor="cantidad">Cantidad producida</label><input id="cantidad" className="field mt-2 tabular-nums" type="number" min="1" step="1" required value={cantidad} onChange={(evento) => setCantidad(evento.target.value)} /></div>
        </div>
        <fieldset className="rounded border border-[var(--line)] p-4">
          <legend className="px-1 text-sm font-semibold">Dimensiones de cada pieza (mm)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="block text-sm" htmlFor="largo-pieza">Largo</label><input id="largo-pieza" className="field mt-2 tabular-nums" type="number" min="0.01" max="99999999.99" step="0.01" inputMode="decimal" value={largoPiezaMm} onChange={(evento) => setLargoPiezaMm(evento.target.value)} placeholder="Opcional" /></div>
            <div><label className="block text-sm" htmlFor="ancho-pieza">Ancho</label><input id="ancho-pieza" className="field mt-2 tabular-nums" type="number" min="0.01" max="99999999.99" step="0.01" inputMode="decimal" value={anchoPiezaMm} onChange={(evento) => setAnchoPiezaMm(evento.target.value)} placeholder="Opcional" /></div>
            <div><label className="block text-sm" htmlFor="alto-pieza">Alto</label><input id="alto-pieza" className="field mt-2 tabular-nums" type="number" min="0.01" max="99999999.99" step="0.01" inputMode="decimal" value={altoPiezaMm} onChange={(evento) => setAltoPiezaMm(evento.target.value)} placeholder="Opcional" /></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Ingrese las tres medidas de una pieza. Puede dejarlas vacías si aún no se conocen.</p>
        </fieldset>
        <VisualizadorDimensiones
          largoMm={medidasCompletas ? Number(largoPiezaMm) : undefined}
          anchoMm={medidasCompletas ? Number(anchoPiezaMm) : undefined}
          altoMm={medidasCompletas ? Number(altoPiezaMm) : undefined}
        />
        <div className="rounded border border-[#d8e6d9] bg-[#f3f8f1] p-4"><p className="text-xs font-bold uppercase text-[var(--forest)]">Muestra mínima</p><p className="mt-1 text-sm leading-6">{muestra}</p></div>
        <div><div className="flex items-center justify-between gap-3"><label className="block text-sm font-semibold" htmlFor="proveedor">Proveedor</label><button type="button" onClick={() => setModalProveedor(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-sm font-semibold text-[var(--forest)] hover:bg-[var(--lime-soft)]"><Plus size={15} />Agregar proveedor</button></div><select id="proveedor" className="field mt-2" required value={proveedorId} onChange={(evento) => setProveedorId(evento.target.value)}><option value="">Seleccione un proveedor</option>{proveedoresDisponibles.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}{proveedor.activo ? "" : " · Inactivo (actual)"}</option>)}</select></div>
        {error && <p className="rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--line)] pt-5"><Link href={editar ? `/calidad/lotes/${encodeURIComponent(inicial!.codigo)}` : "/calidad"} className="inline-flex min-h-11 items-center rounded border border-[var(--line)] px-4 text-sm font-semibold">Cancelar</Link><button type="submit" disabled={cargando || proveedoresDisponibles.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded bg-[var(--forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--forest-deep)] disabled:opacity-50"><Save size={16} />{cargando ? "Guardando…" : "Guardar lote"}</button></div>
      </form>
      {modalProveedor && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="presentation"><form role="dialog" aria-modal="true" aria-labelledby="titulo-proveedor" onSubmit={crearProveedor} className="surface w-full max-w-md p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 id="titulo-proveedor" className="text-lg font-semibold">Agregar proveedor</h2><p className="mt-1 text-sm text-[var(--muted)]">El proveedor quedará activo al crearlo.</p></div><button type="button" onClick={() => setModalProveedor(false)} title="Cerrar" className="flex size-9 items-center justify-center rounded hover:bg-[#eff2ef]"><X size={18} /></button></div><label htmlFor="proveedor-nuevo" className="mt-5 block text-sm font-semibold">Nombre</label><input id="proveedor-nuevo" className="field mt-2" minLength={2} maxLength={80} required value={nombreNuevo} onChange={(evento) => setNombreNuevo(evento.target.value)} /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModalProveedor(false)} className="min-h-10 rounded border border-[var(--line)] px-3 text-sm">Cancelar</button><button type="submit" className="min-h-10 rounded bg-[var(--forest)] px-3 text-sm font-semibold text-white">Guardar proveedor</button></div></form></div>}
    </div>
  );
}