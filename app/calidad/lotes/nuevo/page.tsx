import { FormularioLote } from "@/components/calidad/FormularioLote";
import { hoyBogota } from "@/lib/reglas/fechas";

export default function NuevoLotePage() {
  return <FormularioLote hoy={hoyBogota()} />;
}