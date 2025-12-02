"use client";

type LoadingOverlayProps = {
  show: boolean;
  text?: string;
};

export default function LoadingOverlay({ show, text }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl bg-neutral-900 px-8 py-6 shadow-2xl border border-neutral-700/70">
        <div className="flex flex-col items-center gap-4">
          {/* Puntitos estilo ChatGPT */}
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-white animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-white/80 animate-bounce"
              style={{ animationDelay: "130ms" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: "260ms" }}
            />
          </div>

          <p className="text-sm text-neutral-300">
            {text ?? "Cargando…"}
          </p>
        </div>
      </div>
    </div>
  );
}