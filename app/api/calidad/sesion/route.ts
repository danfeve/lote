import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { respuestaOk } from "@/lib/http/respuestas";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await exigirUsuario();
  return respuestaOk({ nombre: usuario.nombre, correo: usuario.correo });
}