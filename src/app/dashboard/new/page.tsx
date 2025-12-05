"use client";

import { useRouter } from "next/navigation";
import { Database } from "lucide-react";

export default function NewQueryPage() {
  const router = useRouter();

  function go(engine: "postgres" | "mysql") {
    router.push(`/dashboard/upload?engine=${engine}`);
  }

  function goBack() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-[#161616] border border-neutral-800/70 px-10 py-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Nueva consulta
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              ¿En qué motor está tu base de datos? Primero elige el motor,
              luego subiremos los scripts <span className="font-mono">.sql</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="text-xs rounded-full border border-neutral-700 px-4 py-2 text-neutral-300 hover:border-neutral-500 hover:text-white transition"
          >
            Volver al dashboard
          </button>
        </div>

        {/* Cards de motores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PostgreSQL */}
          <button
            type="button"
            onClick={() => go("postgres")}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-6 py-5 text-left hover:border-sky-500/60 hover:bg-neutral-900/90 transition"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/40">
              <Database className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                PostgreSQL
                <span className="text-[10px] rounded-full bg-sky-500/15 text-sky-300 px-2 py-0.5">
                  Recomendado
                </span>
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Ideal para dumps de laboratorios, proyectos académicos y
                esquemas relacionales clásicos.
              </p>
            </div>
            <span className="mt-2 text-xs text-sky-300 opacity-0 group-hover:opacity-100 transition">
              Elegir PostgreSQL →
            </span>
          </button>

          {/* MySQL */}
          <button
            type="button"
            onClick={() => go("mysql")}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-6 py-5 text-left hover:border-amber-400/70 hover:bg-neutral-900/90 transition"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-400/5 border border-amber-400/40">
              <Database className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold">MySQL / MariaDB</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Para proyectos que ya usan MySQL. Más adelante podrás usar el
                mismo asistente NL → SQL sobre este motor.
              </p>
            </div>
            <span className="mt-2 text-xs text-amber-300 opacity-0 group-hover:opacity-100 transition">
              Elegir MySQL →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}