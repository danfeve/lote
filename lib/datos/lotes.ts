import type { PoolClient } from "pg";
import { LIMITE_HISTORIAL } from "@/lib/config/calidad";
import { conTransaccion, consultar } from "@/lib/db/conexion";
import { traducirErrorBd } from "@/lib/datos/erroresBd";
import type { DetalleLote, FilaLote } from "@/lib/datos/tipos";
import {
  accionesPermitidas,
  decidirResultado,
  siguienteNumeroInspeccion,
  type EstadoLote,
  type ReglaAplicada,
} from "@/lib/reglas/decision";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { explicarMuestraMinima, calcularMuestraMinima } from "@/lib/reglas/muestra";
import { normalizarCodigo, validarFechaProduccion } from "@/lib/reglas/lote";
import { hoyBogota } from "@/lib/reglas/fechas";
import type { DatosLote, FiltrosHistorial } from "@/lib/validacion/esquemas";

interface LoteDb {
  codigo: string;
  producto: string;
  proveedor_id: number;
  proveedor_nombre: string;
  proveedor_activo: boolean;
  fecha_produccion: string;
  cantidad_producida: number;
  muestra_minima: number;
  estado: EstadoLote;
  total_inspecciones: number;
  fecha_decision?: string | null;
  ultima_numero: 1 | 2 | null;
  ultima_muestreadas: number | null;
  ultima_defectuosas: number | null;
  ultima_criticas: number | null;
  ultima_porcentaje: number | null;
  ultima_regla: ReglaAplicada | null;
}

function mapearLote(fila: LoteDb): FilaLote {
  return {
    codigo: fila.codigo,
    producto: fila.producto,
    proveedorId: fila.proveedor_id,
    proveedorNombre: fila.proveedor_nombre,
    proveedorActivo: fila.proveedor_activo,
    fechaProduccion: fila.fecha_produccion,
    cantidadProducida: fila.cantidad_producida,
    muestraMinima: fila.muestra_minima,
    estado: fila.estado,
    totalInspecciones: fila.total_inspecciones,
    ultima: fila.ultima_numero === null
      ? null
      : {
          numero: fila.ultima_numero,
          muestreadas: fila.ultima_muestreadas ?? 0,
          defectuosas: fila.ultima_defectuosas ?? 0,
          criticas: fila.ultima_criticas ?? 0,
          porcentaje: fila.ultima_porcentaje ?? 0,
          regla: fila.ultima_regla ?? "R3",
        },
  };
}

function sqlLotesBase(): string {
  return "select * from public.v_lotes";
}

export async function listarLotes(
  filtros: FiltrosHistorial = {},
): Promise<FilaLote[]> {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];
  if (filtros.estado) {
    parametros.push(filtros.estado);
    condiciones.push(`estado = $${parametros.length}`);
  }
  if (filtros.proveedorId) {
    parametros.push(filtros.proveedorId);
    condiciones.push(`proveedor_id = $${parametros.length}`);
  }
  if (filtros.codigo) {
    const codigo = normalizarCodigo(filtros.codigo).replace(/[\\%_]/g, "\\$&");
    parametros.push(`%${codigo}%`);
    condiciones.push(`codigo ilike $${parametros.length} escape E'\\\\'`);
  }
  parametros.push(LIMITE_HISTORIAL);
  const filas = await consultar<LoteDb>(
    `${sqlLotesBase()} ${condiciones.length ? `where ${condiciones.join(" and ")}` : ""}
     order by created_at desc, codigo limit $${parametros.length}`,
    parametros,
  );
  return filas.map(mapearLote);
}

export async function listarBandeja(): Promise<FilaLote[]> {
  const filas = await consultar<LoteDb>(
    `${sqlLotesBase()} where estado in ('pendiente', 'en_revision')
     order by created_at asc, codigo`,
  );
  return filas.map(mapearLote);
}

export async function obtenerFilaLote(codigo: string): Promise<FilaLote | null> {
  const filas = await consultar<LoteDb>(
    `${sqlLotesBase()} where codigo = $1`,
    [normalizarCodigo(codigo)],
  );
  return filas[0] ? mapearLote(filas[0]) : null;
}

export async function registrarLote(datos: DatosLote): Promise<FilaLote> {
  validarFechaProduccion(datos.fechaProduccion, hoyBogota());
  const codigo = normalizarCodigo(datos.codigo);
  const muestraMinima = calcularMuestraMinima(datos.cantidadProducida);
  try {
    return await conTransaccion(async (tx) => {
      await verificarProveedorActivo(tx, datos.proveedorId);
      await tx.query(
        `insert into public.lotes
         (codigo, producto, fecha_produccion, cantidad_producida, proveedor_id, muestra_minima)
         values ($1, $2, $3, $4, $5, $6)`,
        [codigo, datos.producto, datos.fechaProduccion, datos.cantidadProducida, datos.proveedorId, muestraMinima],
      );
      const filas = await consultarLoteTx(tx, codigo);
      return mapearLote(filas[0]);
    });
  } catch (error) {
    traducirErrorBd(error);
  }
}

export async function actualizarLote(
  codigoActual: string,
  datos: DatosLote,
): Promise<FilaLote> {
  validarFechaProduccion(datos.fechaProduccion, hoyBogota());
  const codigo = normalizarCodigo(codigoActual);
  const nuevoCodigo = normalizarCodigo(datos.codigo);
  try {
    return await conTransaccion(async (tx) => {
      const existente = await bloquearLote(tx, codigo);
      if (existente.estado !== "pendiente" || existente.total_inspecciones !== 0) {
        throw new ErrorDeNegocio("LOTE_NO_MODIFICABLE");
      }
      if (datos.proveedorId !== existente.proveedor_id) {
        await verificarProveedorActivo(tx, datos.proveedorId);
      }
      await tx.query(
        `update public.lotes
         set codigo = $1, producto = $2, fecha_produccion = $3,
             cantidad_producida = $4, proveedor_id = $5, muestra_minima = $6,
             updated_at = now()
         where codigo = $7`,
        [nuevoCodigo, datos.producto, datos.fechaProduccion, datos.cantidadProducida,
          datos.proveedorId, calcularMuestraMinima(datos.cantidadProducida), codigo],
      );
      const filas = await consultarLoteTx(tx, nuevoCodigo);
      return mapearLote(filas[0]);
    });
  } catch (error) {
    traducirErrorBd(error);
  }
}

export async function eliminarLote(codigo: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const lote = await bloquearLote(tx, normalizarCodigo(codigo));
    if (lote.estado !== "pendiente" || lote.total_inspecciones !== 0) {
      throw new ErrorDeNegocio("LOTE_NO_MODIFICABLE");
    }
    await tx.query("delete from public.lotes where codigo = $1", [lote.codigo]);
  });
}

export async function obtenerDetalleLote(codigo: string): Promise<DetalleLote> {
  const codigoNormalizado = normalizarCodigo(codigo);
  const filas = await consultar<LoteDb>(
    `${sqlLotesBase()} where codigo = $1`,
    [codigoNormalizado],
  );
  if (!filas[0]) throw new ErrorDeNegocio("LOTE_NO_ENCONTRADO");
  const fila = filas[0];
  const inspeccionesDb = await consultar<{
    numero_inspeccion: 1 | 2;
    fecha_inspeccion: string;
    piezas_muestreadas: number;
    piezas_defectuosas: number;
    piezas_criticas: number;
    porcentaje_defectuoso: number;
    resultado: "aprobado" | "en_revision" | "rechazado";
    regla: ReglaAplicada;
    observaciones: string | null;
  }>(
    `select numero_inspeccion, fecha_inspeccion, piezas_muestreadas,
            piezas_defectuosas, piezas_criticas, porcentaje_defectuoso,
            resultado, regla, observaciones
     from public.inspecciones where codigo_lote = $1 order by numero_inspeccion`,
    [codigoNormalizado],
  );
  const inspecciones = inspeccionesDb.map((inspeccion) => ({
    numero: inspeccion.numero_inspeccion,
    fecha: inspeccion.fecha_inspeccion,
    muestreadas: inspeccion.piezas_muestreadas,
    defectuosas: inspeccion.piezas_defectuosas,
    criticas: inspeccion.piezas_criticas,
    porcentaje: inspeccion.porcentaje_defectuoso,
    resultado: inspeccion.resultado,
    regla: inspeccion.regla,
    explicacion: decidirResultado({
      numeroInspeccion: inspeccion.numero_inspeccion,
      piezasMuestreadas: inspeccion.piezas_muestreadas,
      piezasDefectuosas: inspeccion.piezas_defectuosas,
      piezasCriticas: inspeccion.piezas_criticas,
    }).explicacion,
    observaciones: inspeccion.observaciones,
  }));
  const lote = mapearLote(fila);
  return {
    lote: { ...lote, fechaDecision: fila.fecha_decision ?? null },
    inspecciones,
    explicacionMuestra: explicarMuestraMinima(fila.cantidad_producida),
    acciones: accionesPermitidas(fila.estado, fila.total_inspecciones),
    siguienteNumeroInspeccion: siguienteNumeroInspeccion(fila.estado),
  };
}

async function verificarProveedorActivo(tx: PoolClient, proveedorId: number) {
  const resultado = await tx.query<{ activo: boolean }>(
    "select activo from public.proveedores where id = $1 for share",
    [proveedorId],
  );
  if (!resultado.rows[0]) throw new ErrorDeNegocio("PROVEEDOR_NO_ENCONTRADO");
  if (!resultado.rows[0].activo) throw new ErrorDeNegocio("PROVEEDOR_INACTIVO");
}

async function bloquearLote(tx: PoolClient, codigo: string): Promise<LoteDb> {
  const resultado = await tx.query<LoteDb>(
    `select l.codigo, l.proveedor_id, l.estado,
            (select count(*)::int from public.inspecciones i where i.codigo_lote = l.codigo) as total_inspecciones
     from public.lotes l where l.codigo = $1 for update`,
    [codigo],
  );
  if (!resultado.rows[0]) throw new ErrorDeNegocio("LOTE_NO_ENCONTRADO");
  return resultado.rows[0];
}

async function consultarLoteTx(tx: PoolClient, codigo: string) {
  const resultado = await tx.query<LoteDb>(
    `${sqlLotesBase()} where codigo = $1`,
    [codigo],
  );
  if (!resultado.rows[0]) throw new ErrorDeNegocio("LOTE_NO_ENCONTRADO");
  return resultado.rows;
}

export { type FiltrosHistorial };