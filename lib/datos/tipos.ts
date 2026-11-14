import type { DatosInspeccion, DatosLote } from "@/lib/validacion/esquemas";
import type {
  AccionLote,
  EstadoLote,
  ReglaAplicada,
} from "@/lib/reglas/decision";

export type { DatosInspeccion, DatosLote };

export interface FilaProveedor {
  id: number;
  nombre: string;
  activo: boolean;
  totalLotes: number;
}

export interface FilaLote {
  codigo: string;
  producto: string;
  proveedorId: number;
  proveedorNombre: string;
  proveedorActivo: boolean;
  fechaProduccion: string;
  cantidadProducida: number;
  largoPiezaMm: number | null;
  anchoPiezaMm: number | null;
  altoPiezaMm: number | null;
  muestraMinima: number;
  estado: EstadoLote;
  totalInspecciones: number;
  ultima: {
    numero: 1 | 2;
    muestreadas: number;
    defectuosas: number;
    criticas: number;
    porcentaje: number;
    regla: ReglaAplicada;
  } | null;
}

export interface InspeccionDetalle {
  numero: 1 | 2;
  fecha: string;
  muestreadas: number;
  defectuosas: number;
  criticas: number;
  porcentaje: number;
  resultado: "aprobado" | "en_revision" | "rechazado";
  regla: ReglaAplicada;
  explicacion: string;
  observaciones: string | null;
}

export interface DetalleLote {
  lote: FilaLote & { fechaDecision: string | null };
  inspecciones: InspeccionDetalle[];
  explicacionMuestra: string;
  acciones: AccionLote[];
  siguienteNumeroInspeccion: 1 | 2 | null;
}

export interface ResultadoRegistroInspeccion {
  codigo: string;
  numeroInspeccion: 1 | 2;
  muestreadas: number;
  defectuosas: number;
  criticas: number;
  porcentaje: number;
  estado: "aprobado" | "en_revision" | "rechazado";
  regla: ReglaAplicada;
  explicacion: string;
}