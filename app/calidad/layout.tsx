import { redirect } from "next/navigation";
import { AppShell } from "@/components/calidad/AppShell";
import { obtenerUsuario } from "@/lib/auth/sesionUsuario";

export default async function CalidadLayout({ children }: LayoutProps<"/calidad">) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");
  return <AppShell nombre={usuario.nombre}>{children}</AppShell>;
}