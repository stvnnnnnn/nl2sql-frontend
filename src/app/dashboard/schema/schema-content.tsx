"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "@/lib/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Database, Send } from "lucide-react";
import RelationalModel from "@/components/RelationalModel";

// -----------------------------
// Types
// -----------------------------
type MessageRole = "user" | "assistant";

interface Message {
  id: number;
  role: MessageRole;
  content: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  is_primary: boolean;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

interface Relationship {
  table: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
}

interface SchemaInfo {
  db_name: string;
  tables: TableInfo[];
  relationships: Relationship[];
}

interface BackendColumn {
  name: string;
  type: string;
  is_primary?: boolean;
}

interface BackendTable {
  columns?: BackendColumn[];
}

interface BackendSchemaResponse {
  db_name?: string;
  schema?: {
    tables?: Record<string, BackendTable>;
    relationships?: Relationship[];
  };
}

// ============================================================
// Component
// ============================================================
export default function SchemaAssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get("conn");

  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"schema" | "mr">("schema");

  // ============================================================
  // 1) Load schema
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

        const res = await axios.get<BackendSchemaResponse>(
          `${BACKEND_URL}/schema/${connectionId}`,
          { withCredentials: true }
        );

        console.log("RAW SCHEMA RESPONSE:", res.data);

        const rawTables = res.data.schema?.tables ?? {};
        const rawRels = res.data.schema?.relationships ?? [];

        const tables: TableInfo[] = Object.entries(rawTables).map(
          ([name, info]): TableInfo => ({
            name,
            columns: (info.columns ?? []).map((c): ColumnInfo => ({
              name: c.name,
              type: c.type,
              is_primary: c.is_primary ?? false,
            })),
          })
        );

        const relationships: Relationship[] = rawRels;

        setSchema({
          db_name: res.data.db_name ?? `Conexión ${connectionId}`,
          tables,
          relationships,
        });
      } catch (err) {
        const error = err as AxiosError;

        if (error.response?.status === 401) {
          router.push("/auth/login");
        } else {
          setError("No se pudo cargar el esquema.");
        }
      } finally {
        setInitialLoading(false);
      }
    }

    loadSchema();
  }, [connectionId, router]);

  // ============================================================
  // 2) Ask NL → SQL
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
      type InferResponse = {
        best_sql?: string;
        best_exec_ok?: boolean;
        best_exec_error?: string | null;
        best_rows_preview?: unknown[][];
      };

      const res = await axios.post<InferResponse>(
        `${BACKEND_URL}/infer`,
        {
          database_id: connectionId,
          natural_query: text,
        },
        { withCredentials: true }
      );

      const data = res.data;

      let assistantText = "";

      assistantText += data.best_exec_ok
        ? "✅ La consulta se ejecutó correctamente.\n\n"
        : "⚠️ Hubo un error al ejecutar la consulta.\n\n";

      if (data.best_sql) assistantText += `SQL generada:\n${data.best_sql}\n\n`;

      if (data.best_rows_preview?.length) {
        assistantText += "Preview de filas:\n";
        assistantText += data.best_rows_preview
          .map((r) => JSON.stringify(r))
          .join("\n");
        assistantText += "\n\n";
      }

      if (data.best_exec_error) {
        assistantText += `Error:\n${data.best_exec_error}`;
      }

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const error = err as AxiosError;

      if (error.response?.status === 401) {
        router.push("/auth/login");
      } else {
        setError("Ocurrió un error al procesar la consulta.");
      }
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
        <main className="flex gap-4 px-8 py-4">
          {/* LEFT: Schema / MR */}
          <aside
            className="
              w-1/3 
              rounded-2xl bg-neutral-900/90 border border-neutral-800 
              p-4 
              h-[78vh]
              overflow-y-auto
            "
          >
            <div className="flex gap-2 mb-3">
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

            {activeTab === "schema" ? (
              <div className="space-y-3 text-xs pr-1">
                {schema?.tables?.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-neutral-950/70 border border-neutral-800 px-3 py-2"
                  >
                    <div className="font-semibold mb-1">{t.name}</div>

                    <div className="flex flex-wrap gap-1 text-neutral-400">
                      {t.columns.map((col, idx) => (
                        <span
                          key={`${col.name}-${idx}`}
                          className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800"
                        >
                          {col.name} <span className="text-neutral-500">({col.type})</span>
                          {col.is_primary && (
                            <span className="text-yellow-400 ml-1">PK</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full overflow-hidden rounded-xl">
                {schema && (
                  <RelationalModel
                    tables={schema.tables}
                    relationships={schema.relationships}
                  />
                )}
              </div>
            )}
          </aside>

          {/* RIGHT: Chat */}
          <section
            className="
              flex flex-col 
              w-2/3
              rounded-2xl bg-neutral-900/90 border border-neutral-800
              h-[78vh]
            "
          >
            <div
              className="
                flex-1 
                overflow-y-auto
                p-4 space-y-3 text-sm
              "
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`whitespace-pre-wrap rounded-2xl px-3 py-2 max-w-[95%] ${
                    msg.role === "user"
                      ? "ml-auto bg-white text-black"
                      : "mr-auto bg-neutral-800 text-neutral-50"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-800 p-4 bg-neutral-900 shrink-0">
              <div className="flex items-end gap-3">
                {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

                <textarea
                  onKeyDown={handleKeyDown}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="Escribe tu consulta..."
                  className="flex-1 resize-none rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white outline-none"
                />

                <button
                  onClick={handleAsk}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold"
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