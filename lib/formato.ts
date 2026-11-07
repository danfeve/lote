export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00.000Z`));
}

export function formatearPorcentaje(porcentaje: number): string {
  return porcentaje.toFixed(2).replace(".", ",");
}