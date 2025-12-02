"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Database, Send, Mic } from "lucide-react";

type MessageRole = "user" | "assistant";

interface Message {
  id: number;
  role: MessageRole;
  content: string;
}

interface TableInfo {
  name: string;
  columns: string[];
}

interface SchemaInfo {
  db_name: string;
  tables: TableInfo[];
}

export default function SchemaAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // viene desde /dashboard/upload → ?conn=...
  const connectionId = searchParams.get("conn");

  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");

  // tab actual del panel izquierdo: esquema o modelo relacional
  const [activeTab, setActiveTab] = useState<"schema" | "mr">("schema");

  // ============================================================
  // 1) Cargar esquema al entrar
  // ============================================================
  useEffect(() => {
    if (!connectionId) {
      router.push("/dashboard");
      return;
    }

    async function loadSchema() {
      try {
        setInitialLoading(true);
        setError("");

        const { data } = await axios.get(
          `${BACKEND_URL}/schema/${connectionId}`
        );

        type BackendTable = { columns?: string[] };

        const tablesObj = (data.tables ?? {}) as Record<string, BackendTable>;

        const tablesArray: TableInfo[] = Object.entries(tablesObj).map(
          ([name, info]) => ({
            name,
            columns: info.columns ?? [],
          })
        );

        setSchema({
          db_name: data.schema_summary ?? `Conexión ${connectionId}`,
          tables: tablesArray,
        });
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el esquema de la base de datos.");
      } finally {
        setInitialLoading(false);
      }
    }

    loadSchema();
  }, [connectionId, router]);

  // ============================================================
  // 2) Enviar pregunta → /infer
  // ============================================================
  async function handleAsk() {
    if (!input.trim() || !connectionId) return;

    const text = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
        setLoading(false);
        router.push("/auth/login");
        return;
      }

      const accessToken = sessionData.session.access_token;

      const { data } = await axios.post(
        `${BACKEND_URL}/infer`,
        {
          connection_id: connectionId,
          question: text,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const sql = data.best_sql ?? "";
      const execOk = data.best_exec_ok ?? false;
      const execError = data.best_exec_error as string | null;
      const rowsPreview = (data.best_rows_preview ?? []) as unknown[][];

      let assistantText = "";

      assistantText += execOk
        ? "✅ La consulta se ejecutó correctamente.\n\n"
        : "⚠️ Hubo un error al ejecutar la consulta.\n\n";

      if (sql) {
        assistantText += `SQL generada:\n${sql}\n\n`;
      }

      if (rowsPreview && rowsPreview.length > 0) {
        assistantText += "Preview de filas (máx 5):\n";
        assistantText += rowsPreview
          .map((r) => JSON.stringify(r))
          .join("\n");
        assistantText += "\n\n";
      }

      if (execError) {
        assistantText += `Error:\n${execError}`;
      }

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantText || "No se pudo generar una respuesta.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al procesar la consulta.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleAsk();
    }
  }

  // ============================================================
  // 3) Botón de micrófono → /speech-infer
  // ============================================================
  async function handleSpeech() {
    if (!connectionId) return;

    try {
      setError("");

      // Verificar que el navegador soporte audio
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Tu navegador no soporta captura de audio.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.start();

      // Versión simple: grabar ~5 segundos y enviar
      setTimeout(() => {
        recorder.stop();
      }, 5000);

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        const form = new FormData();
        form.append("connection_id", connectionId);
        form.append("audio", audioBlob, "audio.webm");

        const { data } = await axios.post(
          `${BACKEND_URL}/speech-infer`,
          form
        );

        // data: { transcript, result: InferResponse }
        const transcript = data.transcript as string;
        const result = data.result;

        const userFromVoice: Message = {
          id: Date.now(),
          role: "user",
          content: `🎤 ${transcript}`,
        };

        let assistantText = "";

        assistantText += result.best_exec_ok
          ? "✅ La consulta se ejecutó correctamente.\n\n"
          : "⚠️ Hubo un error al ejecutar la consulta.\n\n";

        if (result.best_sql) {
          assistantText += `SQL generada:\n${result.best_sql}\n\n`;
        }

        if (result.best_rows_preview && result.best_rows_preview.length > 0) {
          assistantText += "Preview de filas (máx 5):\n";
          assistantText += result.best_rows_preview
            .map((r: unknown[]) => JSON.stringify(r))
            .join("\n");
          assistantText += "\n\n";
        }

        if (result.best_exec_error) {
          assistantText += `Error:\n${result.best_exec_error}`;
        }

        const assistantMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantText || "No se pudo generar una respuesta.",
        };

        setMessages((prev) => [...prev, userFromVoice, assistantMsg]);
      };
    } catch (err) {
      console.error(err);
      setError("No se pudo procesar el audio.");
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <LoadingOverlay
        show={loading || initialLoading}
        text={
          initialLoading
            ? "Cargando esquema de la base de datos…"
            : "Generando SQL y ejecutando consulta…"
        }
      />

      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-neutral-900/80">
          <div className="flex items-center gap-2">
            <Database size={20} />
            <div>
              <h1 className="text-lg font-semibold">Asistente NL → SQL</h1>
              <p className="text-xs text-neutral-400">
                Sube una BD, visualiza su esquema y consulta en lenguaje natural.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-xs rounded-full border border-neutral-700 px-4 py-2 text-neutral-300 hover:border-neutral-500 hover:text-white transition"
          >
            Volver al dashboard
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col lg:flex-row gap-4 px-8 py-4">
          {/* Panel izquierdo: Tabs (Esquema / MR) */}
          <aside className="w-full lg:w-1/3 rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-lg text-xs ${
                    activeTab === "schema"
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                  onClick={() => setActiveTab("schema")}
                >
                  Esquema
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs ${
                    activeTab === "mr"
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                  onClick={() => setActiveTab("mr")}
                >
                  Modelo Relacional
                </button>
              </div>
            </div>

            {activeTab === "schema" ? (
              <>
                <p className="text-xs text-neutral-400 mb-3">
                  {schema?.db_name ?? "Base de datos"}
                </p>
                <div className="flex-1 overflow-auto pr-2 space-y-3 text-xs">
                  {schema?.tables && schema.tables.length > 0 ? (
                    schema.tables.map((table) => (
                      <div
                        key={table.name}
                        className="rounded-xl bg-neutral-950/70 border border-neutral-800 px-3 py-2"
                      >
                        <div className="mb-1 font-semibold text-neutral-100 flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px]">
                            T
                          </span>
                          {table.name}
                        </div>
                        <div className="flex flex-wrap gap-1 text-[11px] text-neutral-400">
                          {table.columns.map((col) => (
                            <span
                              key={col}
                              className="rounded-full bg-neutral-900 px-2 py-0.5 border border-neutral-800"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500">
                      No se pudo recuperar la estructura de la base de datos.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-xs text-neutral-500 text-center px-4">
                  Aquí se mostrará el modelo relacional (MR) de tu base de
                  datos. Más adelante podemos hacerlo movible (drag) y con
                  zoom, estilo herramienta de diagramas.
                </div>
              </div>
            )}
          </aside>

          {/* Panel derecho: Chat */}
          <section className="flex-1 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
            <div className="flex-1 overflow-auto p-4 space-y-3 text-sm">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
                  <p>Empieza escribiendo una consulta en lenguaje natural.</p>
                  <p className="mt-1">
                    Ejemplo:{" "}
                    <span className="text-neutral-300">
                      &quot;Muéstrame los 10 clientes con más compras.&quot;
                    </span>
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`whitespace-pre-wrap rounded-2xl px-3 py-2 max-w-[95%] ${
                    msg.role === "user"
                      ? "ml-auto bg-white text-black"
                      : "mr-auto bg-neutral-800 text-neutral-50"
                  } text-sm`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Input + mic */}
            <div className="border-t border-neutral-800 p-4">
              {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Escribe tu consulta en español…"
                  className="flex-1 resize-none rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-neutral-500"
                />
                <button
                  type="button"
                  onClick={handleSpeech}
                  disabled={loading}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hablar (speech-to-text)"
                >
                  <Mic size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={!input.trim() || loading}
                  className="flex items-center gap-2 rounded-xl bg白 px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Preguntar
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}