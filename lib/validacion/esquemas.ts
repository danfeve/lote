import { z } from "zod";
import {
  MAX_OBSERVACIONES,
  MUESTRA_MINIMA_PIEZAS,
  PORCENTAJE_MUESTRA,
  UMBRAL_APROBACION_PCT,
  UMBRAL_REVISION_PCT,
} from "@/lib/config/calidad";

const esquemaFecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use el formato AAAA-MM-DD.")
  .refine((valor) => {
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fecha.valueOf()) && fecha.toISOString().slice(0, 10) === valor;
  }, "Ingrese una fecha real.");

const esquemaCodigo = z
  .string()
  .trim()
  .transform((valor) => valor.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]{1,29}$/, "Use 2 a 30 letras mayúsculas, números o guiones; no inicie con guion."));

export const esquemaProveedor = z.object({
  nombre: z.string().trim().min(2).max(80),
});

export const esquemaCambiosProveedor = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    activo: z.boolean().optional(),
  })
  .refine((datos) => datos.nombre !== undefined || datos.activo !== undefined);

export const esquemaLote = z.object({
  codigo: esquemaCodigo,
  producto: z.string().trim().min(2).max(100),
  fechaProduccion: esquemaFecha,
  cantidadProducida: z.coerce.number().int().positive(),
  proveedorId: z.coerce.number().int().positive(),
});

export const esquemaInspeccion = z.object({
  piezasMuestreadas: z.coerce.number().int().positive(),
  piezasDefectuosas: z.coerce.number().int().nonnegative(),
  piezasCriticas: z.coerce.number().int().nonnegative(),
  observaciones: z
    .string()
    .trim()
    .max(MAX_OBSERVACIONES)
    .transform((valor) => (valor.length === 0 ? undefined : valor))
    .optional(),
});

export const esquemaFiltrosHistorial = z.object({
  estado: z.enum(["pendiente", "en_revision", "aprobado", "rechazado"]).optional(),
  proveedorId: z.coerce.number().int().positive().optional(),
  codigo: z.string().trim().max(30).optional(),
});

export const REGLAS_RESUMEN = {
  umbralAprobacion: UMBRAL_APROBACION_PCT,
  umbralRevision: UMBRAL_REVISION_PCT,
  porcentajeMuestra: PORCENTAJE_MUESTRA,
  muestraMinima: MUESTRA_MINIMA_PIEZAS,
};

export type DatosProveedor = z.infer<typeof esquemaProveedor>;
export type CambiosProveedor = z.infer<typeof esquemaCambiosProveedor>;
export type DatosLote = z.infer<typeof esquemaLote>;
export type DatosInspeccion = z.infer<typeof esquemaInspeccion>;
export type FiltrosHistorial = z.infer<typeof esquemaFiltrosHistorial>;