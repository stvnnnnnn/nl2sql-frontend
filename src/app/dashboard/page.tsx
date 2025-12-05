"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/api";
import type { QueryHistory } from "@/types";
import LoadingOverlay from "@/components/LoadingOverlay";
import { PlusCircle } from "lucide-react";
import QueryCard from "@/components/QueryCard";
import axios from "axios";
import type { AxiosError } from "axios";

export default function Dashboard() {
  const router = useRouter();

  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [overlay, setOverlay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${BACKEND_URL}/history`, {
          withCredentials: true, // 🔥 COOKIE JWT
        });

        setHistory(res.data ?? []);
      } catch (err) {
        const error = err as AxiosError;

        if (error?.response?.status === 401) {
          router.push("/auth/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  function newQuery() {
    setOverlay(true);
    router.push("/dashboard/new");
  }

  return (
    <>
      <LoadingOverlay
        show={overlay || loading}
        text={
          loading ? "Cargando historial…" : "Abriendo asistente para nueva consulta…"
        }
      />

      <div className="bg-[#0D0D0D] text-white min-h-screen p-10">
        <h1 className="text-3xl font-bold mb-6">Mis Consultas</h1>

        {history.length === 0 && !loading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center">
            <p className="text-neutral-400 mb-4">
              Aún no tienes consultas guardadas.
            </p>
            <button
              onClick={newQuery}
              className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition flex items-center gap-2"
            >
              <PlusCircle size={18} />
              Nueva consulta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <QueryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}