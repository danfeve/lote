import { ZodError } from "zod";
import { ErrorDeNegocio, ESTADO_HTTP } from "@/lib/reglas/errores";

const CABECERAS = { "Cache-Control": "no-store" };

export function respuestaOk(datos: unknown, estado = 200): Response {
  return Response.json({ ok: true, datos }, { status: estado, headers: CABECERAS });
}

export function respuestaError(
  codigo: string,
  mensaje: string,
  estado: number,
  detalles?: unknown,
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        codigo,
        mensaje,
        ...(detalles === undefined ? {} : { detalles }),
      },
    },
    { status: estado, headers: CABECERAS },
  );
}

export function conManejoDeErrores<Argumentos extends unknown[]>(
  manejador: (...argumentos: Argumentos) => Promise<Response>,
) {
  return async (...argumentos: Argumentos): Promise<Response> => {
    try {
      return await manejador(...argumentos);
    } catch (error) {
      if (error instanceof ZodError) {
        return respuestaError(
          "DATOS_INVALIDOS",
          "Hay datos que no son válidos. Revise los campos marcados.",
          400,
          error.flatten(),
        );
      }
      if (error instanceof ErrorDeNegocio) {
        return respuestaError(
          error.codigo,
          error.message,
          ESTADO_HTTP[error.codigo],
          error.detalles,
        );
      }
      console.error(error);
      return respuestaError(
        "ERROR_INTERNO",
        "Ocurrió un error inesperado. Intente de nuevo.",
        500,
      );
    }
  };
}

export async function leerJson<T>(
  request: Request,
  esquema: { parse: (dato: unknown) => T },
): Promise<T> {
  return esquema.parse(await request.json());
}