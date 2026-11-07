import { ErrorDeNegocio } from "@/lib/reglas/errores";

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

export function validarFechaProduccion(fecha: string, hoy: string): void {
  if (fecha > hoy) throw new ErrorDeNegocio("FECHA_FUTURA");
}