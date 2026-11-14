"use client";

import { useEffect, useRef } from "react";
import { Download, Package } from "lucide-react";

type Punto = { x: number; y: number };

function camino(
  contexto: CanvasRenderingContext2D,
  puntos: Punto[],
  relleno: string,
) {
  contexto.beginPath();
  contexto.moveTo(puntos[0].x, puntos[0].y);
  for (const punto of puntos.slice(1)) contexto.lineTo(punto.x, punto.y);
  contexto.closePath();
  contexto.fillStyle = relleno;
  contexto.fill();
  contexto.strokeStyle = "#174b3e";
  contexto.lineWidth = 2;
  contexto.stroke();
}

function flecha(
  contexto: CanvasRenderingContext2D,
  inicio: Punto,
  fin: Punto,
  etiqueta: string,
  color: string,
  desplazamiento: Punto,
) {
  const a = { x: inicio.x + desplazamiento.x, y: inicio.y + desplazamiento.y };
  const b = { x: fin.x + desplazamiento.x, y: fin.y + desplazamiento.y };
  const angulo = Math.atan2(b.y - a.y, b.x - a.x);
  const punta = 7;

  contexto.save();
  contexto.strokeStyle = color;
  contexto.fillStyle = color;
  contexto.lineWidth = 1.5;
  contexto.setLineDash([4, 3]);
  contexto.beginPath();
  contexto.moveTo(inicio.x, inicio.y);
  contexto.lineTo(a.x, a.y);
  contexto.moveTo(fin.x, fin.y);
  contexto.lineTo(b.x, b.y);
  contexto.stroke();
  contexto.setLineDash([]);
  contexto.beginPath();
  contexto.moveTo(a.x, a.y);
  contexto.lineTo(b.x, b.y);
  contexto.stroke();

  for (const [punto, direccion] of [[a, angulo], [b, angulo + Math.PI]] as const) {
    contexto.beginPath();
    contexto.moveTo(punto.x, punto.y);
    contexto.lineTo(
      punto.x + Math.cos(direccion - 0.45) * punta,
      punto.y + Math.sin(direccion - 0.45) * punta,
    );
    contexto.lineTo(
      punto.x + Math.cos(direccion + 0.45) * punta,
      punto.y + Math.sin(direccion + 0.45) * punta,
    );
    contexto.closePath();
    contexto.fill();
  }

  contexto.font = "600 13px sans-serif";
  contexto.textAlign = "center";
  contexto.textBaseline = "middle";
  contexto.fillStyle = "#f3f5f2";
  const medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const anchoTexto = contexto.measureText(etiqueta).width + 12;
  contexto.fillRect(medio.x - anchoTexto / 2, medio.y - 10, anchoTexto, 20);
  contexto.fillStyle = color;
  contexto.fillText(etiqueta, medio.x, medio.y);
  contexto.restore();
}

function formatearMm(valor: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(valor);
}

export function VisualizadorDimensiones({
  largoMm,
  anchoMm,
  altoMm,
  mostrarVacio = true,
}: {
  largoMm?: number | null;
  anchoMm?: number | null;
  altoMm?: number | null;
  mostrarVacio?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensionesValidas = [largoMm, anchoMm, altoMm].every(
    (medida) => typeof medida === "number" && Number.isFinite(medida) && medida > 0,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensionesValidas || !largoMm || !anchoMm || !altoMm) return;

    const ancho = 640;
    const alto = 320;
    const densidad = window.devicePixelRatio || 1;
    canvas.width = ancho * densidad;
    canvas.height = alto * densidad;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    contexto.scale(densidad, densidad);
    contexto.fillStyle = "#f3f5f2";
    contexto.fillRect(0, 0, ancho, alto);

    const proyeccionLargo = largoMm;
    const proyeccionAncho = anchoMm;
    const altoProyectado = altoMm;
    const escala = Math.min(
      300 / (proyeccionLargo + proyeccionAncho),
      180 / (0.46 * (proyeccionLargo + proyeccionAncho) + altoProyectado),
    );
    const lx = proyeccionLargo * escala;
    const ay = proyeccionAncho * escala;
    const hz = altoProyectado * escala;
    const minimoX = -ay;
    const maximoX = lx;
    const minimoY = -0.46 * (lx + ay) - hz;
    const maximoY = 0;
    const origenX = (ancho - (maximoX - minimoX)) / 2 - minimoX;
    const origenY = (alto - (maximoY - minimoY)) / 2 - minimoY + 2;
    const punto = (x: number, y: number): Punto => ({ x: origenX + x, y: origenY + y });
    const base = punto(0, 0);
    const frente = punto(lx, -0.46 * lx);
    const fondo = punto(-ay, -0.46 * ay);
    const union = punto(lx - ay, -0.46 * (lx + ay));
    const elevacion = (p: Punto): Punto => ({ x: p.x, y: p.y - hz });

    camino(contexto, [elevacion(base), elevacion(frente), elevacion(union), elevacion(fondo)], "#d8f36a");
    camino(contexto, [base, frente, elevacion(frente), elevacion(base)], "#5c8e66");
    camino(contexto, [frente, union, elevacion(union), elevacion(frente)], "#174b3e");

    flecha(contexto, base, frente, `Largo ${formatearMm(largoMm)} mm`, "#174b3e", { x: 0, y: 30 });
    flecha(contexto, frente, union, `Ancho ${formatearMm(anchoMm)} mm`, "#174b3e", { x: 14, y: 20 });
    flecha(contexto, elevacion(frente), frente, `Alto ${formatearMm(altoMm)} mm`, "#b9443c", { x: 43, y: 0 });
  }, [largoMm, anchoMm, altoMm, dimensionesValidas]);

  function descargarImagen() {
    const canvas = canvasRef.current;
    if (!canvas || !dimensionesValidas) return;
    const enlace = document.createElement("a");
    enlace.download = `pieza-${largoMm}x${anchoMm}x${altoMm}-mm.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  }

  if (!dimensionesValidas && !mostrarVacio) return null;

  return (
    <section className="surface overflow-hidden" aria-label="Imagen de dimensiones de la pieza">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Vista de la pieza</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Representación proporcional · milímetros</p>
        </div>
        {dimensionesValidas && <button type="button" onClick={descargarImagen} title="Descargar imagen PNG" aria-label="Descargar imagen PNG" className="flex size-9 items-center justify-center rounded border border-[var(--line)] bg-white text-[var(--forest)] hover:bg-[var(--lime-soft)]"><Download size={16} /></button>}
      </div>
      {dimensionesValidas ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Pieza de ${formatearMm(largoMm!)} milímetros de largo, ${formatearMm(anchoMm!)} de ancho y ${formatearMm(altoMm!)} de alto`}
          className="block h-auto w-full"
        />
      ) : (
        <div className="flex min-h-32 items-center justify-center gap-3 px-4 py-6 text-sm text-[var(--muted)]">
          <Package size={18} aria-hidden="true" />
          Ingrese las tres medidas para generar la imagen.
        </div>
      )}
    </section>
  );
}