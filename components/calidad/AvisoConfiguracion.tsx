import { Database, TriangleAlert } from "lucide-react";

export function AvisoConfiguracion({ baseDeDatos = false }: { baseDeDatos?: boolean }) {
  return (
    <section className="surface flex gap-4 border-l-4 border-l-[#bd8a21] p-5" role="status">
      <span className="mt-0.5 text-[#8a6417]">{baseDeDatos ? <Database size={20} /> : <TriangleAlert size={20} />}</span>
      <div>
        <h2 className="font-semibold">{baseDeDatos ? "Base de datos sin configurar" : "No se pudo cargar la información"}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{baseDeDatos ? "Configure DATABASE_URL en .env.local y aplique las migraciones para habilitar los registros de lotes y proveedores." : "Revise la conexión con Supabase. Los datos no se han modificado."}</p>
        {baseDeDatos && <code className="mt-3 inline-block rounded bg-[#f1f3ef] px-2 py-1 text-xs text-[var(--forest)]">npm run db:migrar</code>}
      </div>
    </section>
  );
}