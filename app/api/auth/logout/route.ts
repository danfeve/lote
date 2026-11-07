import { cerrarSesion } from "@/lib/auth/sesionUsuario";
import { respuestaOk } from "@/lib/http/respuestas";

export async function POST() {
  await cerrarSesion();
  return respuestaOk({ sesionCerrada: true });
}