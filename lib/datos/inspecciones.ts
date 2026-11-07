import { conTransaccion } from "@/lib/db/conexion";
import { validarInspeccion, validarLoteAdmiteInspeccion } from "@/lib/reglas/inspeccion";
import { decidirResultado, type EstadoLote } from "@/lib/reglas/decision";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { calcularPorcentaje } from "@/lib/reglas/decision";
import { calcularMuestraMinima } from "@/lib/reglas/muestra";
import { hoyBogota } from "@/lib/reglas/fechas";
import { traducirErrorBd } from "@/lib/datos/erroresBd";
import type { ResultadoRegistroInspeccion } from "@/lib/datos/tipos";
import type { DatosInspeccion } from "@/lib/validacion/esquemas";

export async function registrarInspeccion(
  codigo: string,
  datos: DatosInspeccion,
): Promise<ResultadoRegistroInspeccion> {
  try {
    return await conTransaccion(async (tx) => {
      const consulta = await tx.query<{
        codigo: string;
        cantidad_producida: number;
        muestra_minima: number;
        estado: EstadoLote;
      }>(
        `select codigo, cantidad_producida, muestra_minima, estado
         from public.lotes where codigo = $1 for update`,
        [codigo.trim().toUpperCase()],
      );
      const lote = consulta.rows[0];
      if (!lote) throw new ErrorDeNegocio("LOTE_NO_ENCONTRADO");

      const numeroInspeccion = validarLoteAdmiteInspeccion(lote.estado);
      validarInspeccion(
        {
          cantidadProducida: lote.cantidad_producida,
          muestraMinima: Math.max(
            lote.muestra_minima,
            calcularMuestraMinima(lote.cantidad_producida),
          ),
        },
        datos,
      );
      const decision = decidirResultado({ numeroInspeccion, ...datos });
      const fecha = hoyBogota();
      const insertada = await tx.query<{ porcentaje_defectuoso: number }>(
        `insert into public.inspecciones
         (codigo_lote, numero_inspeccion, fecha_inspeccion, piezas_muestreadas,
          piezas_defectuosas, piezas_criticas, resultado, regla, observaciones)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning porcentaje_defectuoso`,
        [codigo.trim().toUpperCase(), numeroInspeccion, fecha,
          datos.piezasMuestreadas, datos.piezasDefectuosas, datos.piezasCriticas,
          decision.estado, decision.regla, datos.observaciones ?? null],
      );
      await tx.query(
        `update public.lotes
         set estado = $1, fecha_decision = $2, updated_at = now()
         where codigo = $3`,
        [decision.estado, decision.estado === "en_revision" ? null : fecha, codigo.trim().toUpperCase()],
      );
      return {
        codigo: lote.codigo,
        numeroInspeccion,
        muestreadas: datos.piezasMuestreadas,
        defectuosas: datos.piezasDefectuosas,
        criticas: datos.piezasCriticas,
        porcentaje: insertada.rows[0]?.porcentaje_defectuoso
          ?? calcularPorcentaje(datos.piezasDefectuosas, datos.piezasMuestreadas),
        estado: decision.estado,
        regla: decision.regla,
        explicacion: decision.explicacion,
      };
    });
  } catch (error) {
    traducirErrorBd(error);
  }
}