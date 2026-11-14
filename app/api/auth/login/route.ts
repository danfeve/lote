import { z } from "zod";
import { crearSesion, validarCredenciales } from "@/lib/auth/sesionUsuario";
import { respuestaError, respuestaOk } from "@/lib/http/respuestas";

const esquemaLogin = z.object({
  correo: z.string().email(),
  clave: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASSWORD || !process.env.AUTH_SECRET) {
    return respuestaError(
      "CONFIGURACION_INCOMPLETA",
      "Configure AUTH_EMAIL, AUTH_PASSWORD y AUTH_SECRET en las variables de entorno del proyecto (en Vercel para producción o en .env.local para desarrollo local).",
      503,
    );
  }
  try {
    const datos = esquemaLogin.parse(await request.json());
    const usuario = validarCredenciales(datos.correo, datos.clave);
    if (!usuario) {
      return respuestaError(
        "NO_AUTORIZADO",
        "El correo o la clave no son correctos.",
        401,
      );
    }
    await crearSesion(usuario);
    return respuestaOk({ nombre: usuario.nombre, correo: usuario.correo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respuestaError("DATOS_INVALIDOS", "Revise el correo y la clave.", 400, error.flatten());
    }
    console.error(error);
    return respuestaError("ERROR_INTERNO", "No fue posible iniciar sesión.", 500);
  }
}