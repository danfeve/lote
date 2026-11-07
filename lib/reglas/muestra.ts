import {
  MUESTRA_MINIMA_PIEZAS,
  PORCENTAJE_MUESTRA,
} from "@/lib/config/calidad";

export function calcularMuestraMinima(cantidad: number): number {
  if (cantidad < MUESTRA_MINIMA_PIEZAS) return cantidad;
  const porcentajeRedondeado = Math.ceil(
    (cantidad * PORCENTAJE_MUESTRA) / 100,
  );
  return Math.max(MUESTRA_MINIMA_PIEZAS, porcentajeRedondeado);
}

export function explicarMuestraMinima(cantidad: number): string {
  const porcentajeEntero = Math.floor(
    (cantidad * PORCENTAJE_MUESTRA) / 100,
  );
  const decima = (cantidad * PORCENTAJE_MUESTRA) % 100;
  const porcentajeTexto = decima === 0
    ? String(porcentajeEntero)
    : `${porcentajeEntero},${String(decima).padStart(2, "0")}`.replace(/0$/, "");
  const porcentajeRedondeado = Math.ceil(
    (cantidad * PORCENTAJE_MUESTRA) / 100,
  );

  if (cantidad < MUESTRA_MINIMA_PIEZAS) {
    return `El lote tiene menos de ${MUESTRA_MINIMA_PIEZAS} piezas: se muestrea el lote completo (${cantidad} piezas).`;
  }
  if (decima === 0 && porcentajeEntero >= MUESTRA_MINIMA_PIEZAS) {
    return `El ${PORCENTAJE_MUESTRA} % de ${cantidad} es ${porcentajeTexto} piezas.`;
  }
  if (porcentajeRedondeado >= MUESTRA_MINIMA_PIEZAS) {
    return `El ${PORCENTAJE_MUESTRA} % de ${cantidad} es ${porcentajeTexto}, redondeado a ${porcentajeRedondeado} piezas.`;
  }
  return `El ${PORCENTAJE_MUESTRA} % de ${cantidad} es ${porcentajeTexto}, por debajo del mínimo de ${MUESTRA_MINIMA_PIEZAS}: se muestrean ${MUESTRA_MINIMA_PIEZAS} piezas.`;
}