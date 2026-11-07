import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { NOMBRE_COOKIE } from "@/lib/auth/sesionUsuario";

async function sesionValida(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(NOMBRE_COOKIE)?.value;
  const clave = process.env.AUTH_SECRET;
  if (!token || !clave || new TextEncoder().encode(clave).length < 32) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(clave));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  const valida = await sesionValida(request);
  if (ruta.startsWith("/api/calidad") && !valida) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          codigo: "NO_AUTORIZADO",
          mensaje: "Debe iniciar sesión para continuar.",
        },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (ruta.startsWith("/calidad") && !valida) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", `${ruta}${request.nextUrl.search}`);
    return NextResponse.redirect(destino);
  }
  if (ruta === "/login" && valida) {
    return NextResponse.redirect(new URL("/calidad", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/calidad/:path*", "/api/calidad/:path*", "/login"],
};