import { ZONA_HORARIA } from "@/lib/config/calidad";

export function ahoraBogota(ahora: Date = new Date()): {
  fecha: string;
  hora: string;
} {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);
  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "00";
  return {
    fecha: `${obtener("year")}-${obtener("month")}-${obtener("day")}`,
    hora: `${obtener("hour")}:${obtener("minute")}:${obtener("second")}`,
  };
}

export function hoyBogota(ahora: Date = new Date()): string {
  return ahoraBogota(ahora).fecha;
}

export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias))
    .toISOString()
    .slice(0, 10);
}

export function diasEntre(desde: string, hasta: string): number {
  const [anioDesde, mesDesde, diaDesde] = desde.split("-").map(Number);
  const [anioHasta, mesHasta, diaHasta] = hasta.split("-").map(Number);
  const inicio = Date.UTC(anioDesde, mesDesde - 1, diaDesde);
  const fin = Date.UTC(anioHasta, mesHasta - 1, diaHasta);
  return Math.round((fin - inicio) / 86_400_000);
}