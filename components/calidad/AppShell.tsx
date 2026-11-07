"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, Factory, LogOut, Plus, Search, Users } from "lucide-react";

const enlaces = [
  { href: "/calidad", nombre: "Bandeja", icono: ClipboardCheck },
  { href: "/calidad/lotes", nombre: "Historial", icono: Search },
  { href: "/calidad/proveedores", nombre: "Proveedores", icono: Users },
];

export function AppShell({ children, nombre }: { children: React.ReactNode; nombre: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);

  async function cerrarSesion() {
    setCerrando(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex min-h-16 flex-col bg-[var(--forest-deep)] text-white md:min-h-screen">
        <Link href="/calidad" className="flex h-[76px] items-center gap-3 px-5">
          <span className="flex size-10 items-center justify-center rounded bg-[var(--lime)] text-[var(--forest-deep)]"><Factory size={21} aria-hidden="true" /></span>
          <span className="leading-tight"><span className="block text-sm font-bold">Calidad</span><span className="mt-1 block text-xs text-white/65">Control por lotes</span></span>
        </Link>
        <nav aria-label="Navegación principal" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {enlaces.map(({ href, nombre: etiqueta, icono: Icono }) => {
            const activo = href === "/calidad" ? ruta === href : ruta.startsWith(href);
            return <Link key={href} href={href} aria-current={activo ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-3 rounded px-3 text-sm transition-colors ${activo ? "bg-white/12 text-[var(--lime)]" : "text-white/75 hover:bg-white/8 hover:text-white"}`}><Icono size={17} aria-hidden="true" />{etiqueta}</Link>;
          })}
        </nav>
        <div className="mt-auto hidden border-t border-white/15 p-4 md:block">
          <p className="truncate text-xs text-white/60">Sesión iniciada</p><p className="mt-1 truncate text-sm font-medium">{nombre}</p>
          <button type="button" onClick={cerrarSesion} disabled={cerrando} title="Cerrar sesión" className="mt-4 flex min-h-10 w-full items-center gap-2 rounded px-2 text-sm text-white/75 hover:bg-white/10 hover:text-white disabled:opacity-50"><LogOut size={16} aria-hidden="true" />{cerrando ? "Cerrando…" : "Cerrar sesión"}</button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-[58px] items-center justify-between border-b border-[var(--line)] bg-white px-4 sm:px-7">
          <p className="text-xs font-medium text-[var(--muted)]">PLANTA · CONTROL DE PRODUCCIÓN</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cerrarSesion} disabled={cerrando} title="Cerrar sesión" aria-label="Cerrar sesión" className="flex size-10 items-center justify-center rounded border border-[var(--line)] text-[var(--muted)] hover:bg-[#f5f7f4] md:hidden"><LogOut size={17} aria-hidden="true" /></button>
            <Link href="/calidad/lotes/nuevo" title="Registrar lote" className="inline-flex min-h-10 items-center gap-2 rounded bg-[var(--forest)] px-3 text-sm font-semibold text-white hover:bg-[var(--forest-deep)]"><Plus size={16} aria-hidden="true" /><span className="hidden sm:inline">Registrar lote</span><span className="sm:hidden">Nuevo lote</span></Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}