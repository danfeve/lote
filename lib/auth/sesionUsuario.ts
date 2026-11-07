import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ErrorDeNegocio } from "@/lib/reglas/errores";

const NOMBRE_COOKIE = "calidad_sesion";
const DURACION_SEGUNDOS = 60 * 60 * 8;

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

function claveSesion(): Uint8Array {
  const clave = process.env.AUTH_SECRET;
  if (!clave || new TextEncoder().encode(clave).length < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(clave);
}

export function validarCredenciales(correo: string, clave: string): Usuario | null {
  const correoEsperado = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const claveEsperada = process.env.AUTH_PASSWORD;
  if (!correoEsperado || !claveEsperada) return null;
  const correoRecibido = Buffer.from(correo.trim().toLowerCase());
  const correoConfigurado = Buffer.from(correoEsperado);
  const claveRecibida = Buffer.from(clave);
  const claveConfigurada = Buffer.from(claveEsperada);
  const correoValido = correoRecibido.length === correoConfigurado.length
    && timingSafeEqual(correoRecibido, correoConfigurado);
  const claveValida = claveRecibida.length === claveConfigurada.length
    && timingSafeEqual(claveRecibida, claveConfigurada);
  if (!correoValido || !claveValida) return null;
  return {
    id: correoEsperado,
    nombre: process.env.AUTH_NOMBRE?.trim() || "Inspector de calidad",
    correo: correoEsperado,
  };
}

export async function crearSesion(usuario: Usuario): Promise<void> {
  const token = await new SignJWT({ nombre: usuario.nombre, correo: usuario.correo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEGUNDOS}s`)
    .setSubject(usuario.id)
    .sign(claveSesion());
  const almacena = await cookies();
  almacena.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacena = await cookies();
  almacena.delete(NOMBRE_COOKIE);
}

export async function obtenerUsuario(): Promise<Usuario | null> {
  const token = (await cookies()).get(NOMBRE_COOKIE)?.value;
  if (!token) return null;
  try {
    const verificado = await jwtVerify(token, claveSesion());
    if (!verificado.payload.sub) return null;
    return {
      id: verificado.payload.sub,
      nombre: String(verificado.payload.nombre ?? "Inspector de calidad"),
      correo: String(verificado.payload.correo ?? verificado.payload.sub),
    };
  } catch {
    return null;
  }
}

export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await obtenerUsuario();
  if (!usuario) throw new ErrorDeNegocio("NO_AUTORIZADO");
  return usuario;
}

export { NOMBRE_COOKIE, claveSesion };