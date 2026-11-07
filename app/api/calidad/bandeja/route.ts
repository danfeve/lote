import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { listarBandeja } from "@/lib/dataService";
import { conManejoDeErrores, respuestaOk } from "@/lib/http/respuestas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async () => {
  await exigirUsuario();
  return respuestaOk(await listarBandeja());
});