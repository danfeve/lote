"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Factory, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correo, clave }) });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error?.mensaje ?? "No fue posible iniciar sesión.");
      const destino = new URLSearchParams(window.location.search).get("next");
      router.replace(destino?.startsWith("/calidad") ? destino : "/calidad");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No fue posible iniciar sesión.");
    } finally { setCargando(false); }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <section className="relative flex min-h-[34vh] flex-col justify-between overflow-hidden bg-[var(--forest-deep)] p-7 text-white md:min-h-screen md:p-12"><div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: "radial-gradient(#d8f36a 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} /><div className="relative flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded bg-[var(--lime)] text-[var(--forest-deep)]"><Factory size={22} /></span><div><p className="font-semibold">Control de calidad</p><p className="text-xs text-white/65">Producción · lotes</p></div></div><div className="relative max-w-xl py-8"><p className="text-xs font-bold uppercase text-[var(--lime)]">Gestión de inspecciones</p><h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Cada lote, una decisión clara.</h1><p className="mt-4 max-w-md text-sm leading-6 text-white/72">Registre muestras, aplique criterios consistentes y mantenga el historial de producción en un solo lugar.</p></div><p className="relative text-xs text-white/55">Acceso de inspector · sesión segura</p></section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10"><form onSubmit={iniciarSesion} className="w-full max-w-[390px]"><div className="mb-7 flex size-11 items-center justify-center rounded bg-[var(--lime-soft)] text-[var(--forest)]"><LockKeyhole size={20} /></div><p className="text-xs font-bold uppercase text-[var(--forest)]">Área de calidad</p><h2 className="mt-2 text-2xl font-semibold">Iniciar sesión</h2><p className="mt-2 text-sm text-[var(--muted)]">Ingrese las credenciales de inspector configuradas para esta planta.</p><label className="mt-7 block text-sm font-semibold" htmlFor="correo">Correo</label><input id="correo" className="field mt-2" type="email" autoComplete="username" required value={correo} onChange={(evento) => setCorreo(evento.target.value)} /><label className="mt-5 block text-sm font-semibold" htmlFor="clave">Clave</label><input id="clave" className="field mt-2" type="password" autoComplete="current-password" required value={clave} onChange={(evento) => setClave(evento.target.value)} />{error && <p className="mt-4 rounded border border-[#efc0ba] bg-[var(--coral-soft)] p-3 text-sm text-[var(--coral)]" role="alert">{error}</p>}<button type="submit" disabled={cargando} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-[var(--forest)] px-4 font-semibold text-white hover:bg-[var(--forest-deep)] disabled:opacity-60">{cargando ? "Verificando…" : "Entrar"}<ArrowRight size={17} aria-hidden="true" /></button><p className="mt-5 text-xs leading-5 text-[var(--muted)]">Configure el acceso con las variables descritas en el README del proyecto y reinicie el servidor.</p></form></section>
    </main>
  );
}