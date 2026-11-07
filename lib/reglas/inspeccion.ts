import { ErrorDeNegocio } from "@/lib/reglas/errores";
import type { EstadoLote } from "@/lib/reglas/decision";

export function validarLoteAdmiteInspeccion(estado: EstadoLote): 1 | 2 {
  if (estado === "pendiente") return 1;
  if (estado === "en_revision") return 2;
  throw new ErrorDeNegocio("LOTE_CERRADO");
}

export function validarInspeccion(
  lote: { cantidadProducida: number; muestraMinima: number },
  datos: {
    piezasMuestreadas: number;
    piezasDefectuosas: number;
    piezasCriticas: number;
  },
): void {
  const valores = Object.values(datos);
  if (valores.some((valor) => !Number.isInteger(valor) || valor < 0)) {
    throw new ErrorDeNegocio("DATOS_INVALIDOS");
  }
  if (datos.piezasMuestreadas < lote.muestraMinima) {
    throw new ErrorDeNegocio("MUESTRA_INSUFICIENTE", undefined, {
      muestraMinima: lote.muestraMinima,
    });
  }
  if (datos.piezasMuestreadas > lote.cantidadProducida) {
    throw new ErrorDeNegocio("MUESTRA_EXCEDE_LOTE", undefined, {
      cantidad: lote.cantidadProducida,
    });
  }
  if (datos.piezasDefectuosas > datos.piezasMuestreadas) {
    throw new ErrorDeNegocio("DEFECTUOSAS_EXCEDEN_MUESTRA");
  }
  if (datos.piezasCriticas > datos.piezasDefectuosas) {
    throw new ErrorDeNegocio("CRITICAS_EXCEDEN_DEFECTUOSAS");
  }
}