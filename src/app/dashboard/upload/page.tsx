"use client";

import { useState, type ChangeEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { UploadCloud } from "lucide-react";

type Mode = "full" | "schema_data" | "zip";

interface BackendError {
  detail?: string;
  message?: string;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  function changeMode(newMode: Mode) {
    setMode(newMode);
    setFiles([]);
    setError(null);
  }

  async function handleUpload() {
    try {
      setError(null);

      if (files.length === 0) {
        if (mode === "schema_data") {
          setError("Selecciona 2 archivos .sql (esquema y datos).");
        } else if (mode === "zip") {
          setError("Selecciona un archivo .zip con scripts .sql de PostgreSQL.");
        } else {
          setError("Selecciona un archivo .sql con esquema + datos.");
        }
        return;
      }

      // Validaciones por modo (lado frontend)
      if (mode === "full" && files.length !== 1) {
        setError("Modo FULL requiere exactamente 1 archivo .sql.");
        return;
      }
      if (mode === "schema_data" && files.length !== 2) {
        setError("Modo esquema+datos requiere exactamente 2 archivos .sql.");
        return;
      }
      if (mode === "zip" && files.length !== 1) {
        setError("Modo ZIP requiere exactamente 1 archivo .zip.");
        return;
      }

      setLoading(true);

      // 1) Obtener sesión actual de Supabase
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error obteniendo sesión de Supabase:", sessionError);
      }

      const accessToken = sessionData.session?.access_token ?? "";
      const userId = sessionData.session?.user.id ?? "";

      // 2) Construir el FormData
      const form = new FormData();
      form.append("mode", mode);

      // el backend espera db_files: List[UploadFile]
      for (const f of files) {
        form.append("db_files", f);
      }

      // 3) Llamar al backend (NO seteamos Content-Type, axios lo hace solo)
      const { data } = await axios.post(`${BACKEND_URL}/upload`, form, {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...(userId && { "X-User-Id": userId }),
        },
      });

      // 4) Redirigir al asistente con el id de conexión
      const connectionId = data?.connection_id ?? data?.id ?? null;

      if (!connectionId) {
        setError("El backend no devolvió un identificador de conexión.");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/schema?conn=${connectionId}`);
    } catch (err: unknown) {
      console.error("Error subiendo BD:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as BackendError | undefined;
        const backendMsg = data?.detail ?? data?.message ?? data?.error;

        console.error("Respuesta backend /upload:", {
          status,
          data: err.response?.data,
        });

        if (status === 401) {
          setError(
            backendMsg ||
              "El backend devolvió 401 (No autorizado). Revisa si el espacio está protegido o si requiere un token/API key."
          );
        } else if (status === 400) {
          setError(
            backendMsg ||
              "El servidor rechazó el archivo (400). Revisa que sea un .sql o .zip válido."
          );
        } else {
          setError(
            backendMsg ||
              `Error del servidor (status ${status ?? "desconocido"}).`
          );
        }
      } else {
        setError("Ocurrió un error inesperado al subir la base de datos.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
    setError(null);
  }

  function openFileDialog() {
    const input = document.getElementById(
      "db-file-input"
    ) as HTMLInputElement | null;
    input?.click();
  }

  function handleCancel() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-[#161616] shadow-2xl border border-neutral-800/70 px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Subir Base de Datos</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Elige un modo de carga y sube tus scripts{" "}
              <span className="font-mono">.sql</span> de PostgreSQL
              (esquema + datos).
            </p>
          </div>

          <div className="rounded-full border border-neutral-700/70 px-4 py-1 text-xs text-neutral-300 bg-neutral-900/60">
            Sesión NL → SQL
          </div>
        </div>

        {/* Modo de carga */}
        <div className="mb-6">
          <p className="text-sm text-neutral-300 mb-2">Modo de carga</p>
          <div className="inline-flex rounded-full bg-neutral-900 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => changeMode("full")}
              className={`px-4 py-1 text-xs rounded-full transition ${
                mode === "full"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Full .sql (esquema + datos)
            </button>

            <button
              type="button"
              onClick={() => changeMode("schema_data")}
              className={`px-4 py-1 text-xs rounded-full transition ${
                mode === "schema_data"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Esquema + datos (2 .sql)
            </button>

            <button
              type="button"
              onClick={() => changeMode("zip")}
              className={`px-4 py-1 text-xs rounded-full transition ${
                mode === "zip"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              ZIP con scripts .sql
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div className="mb-6">
          <div
            className="border border-dashed border-neutral-700 rounded-2xl bg-neutral-900/40 px-6 py-10 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-500 hover:bg-neutral-900/70 transition"
            onClick={openFileDialog}
          >
            {/* input oculto */}
            <input
              id="db-file-input"
              type="file"
              className="hidden"
              accept={mode === "zip" ? ".zip" : ".sql"}
              multiple={mode === "schema_data"}
              onChange={handleFileChange}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 mb-3">
              <UploadCloud size={28} className="text-neutral-400" />
            </div>

            <p className="text-sm text-neutral-300 mb-1">
              Haz clic aquí para seleccionar archivo(s)
            </p>

            {/* Descripción breve por modo */}
            <p className="text-xs text-neutral-500 text-center">
              {mode === "full" && (
                <>
                  Sube un único archivo{" "}
                  <span className="font-mono">.sql</span> con esquema + datos
                  (dump completo de PostgreSQL).
                </>
              )}
              {mode === "schema_data" && (
                <>
                  Selecciona 2 archivos{" "}
                  <span className="font-mono">.sql</span>: uno de esquema y otro
                  de datos. Se ejecutan en orden.
                </>
              )}
              {mode === "zip" && (
                <>
                  Sube un archivo{" "}
                  <span className="font-mono">.zip</span> que contenga scripts{" "}
                  <span className="font-mono">.sql</span> de PostgreSQL. Ignoramos
                  el resto de archivos.
                </>
              )}
            </p>

            <p className="text-xs text-neutral-400 mt-3 italic">
              {files.length > 0 ? (
                <>
                  Archivos seleccionados:{" "}
                  <span className="font-mono text-neutral-200">
                    {files.map((f) => f.name).join(", ")}
                  </span>
                </>
              ) : (
                "Ningún archivo seleccionado"
              )}
            </p>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-700 text-neutral-200 hover:bg-neutral-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleUpload}
            className="px-5 py-2 text-sm rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Subiendo…" : "Subir y continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}