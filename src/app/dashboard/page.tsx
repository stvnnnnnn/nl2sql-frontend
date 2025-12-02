"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { QueryHistory, SessionData } from "@/types";
import LoadingOverlay from "@/components/LoadingOverlay";
import { PlusCircle } from "lucide-react";
import QueryCard from "@/components/QueryCard";

export default function Dashboard() {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_session, setSession] = useState<SessionData | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/auth/login");

      const userData: SessionData = {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || "",
        },
      };

      setSession(userData);

      const { data: rows } = await supabase
        .from("queries_history")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setHistory(rows ?? []);
    }

    load();
  }, [router]);

  function newQuery() {
    setOverlay(true); // mostramos loader tipo ChatGPT
    router.push("/dashboard/upload");
  }

  return (
    <>
      <LoadingOverlay
        show={overlay}
        text="Abriendo asistente para nueva consulta…"
      />

      <div className="bg-[#0D0D0D] text-white min-h-screen p-10">
        <h1 className="text-3xl font-bold mb-6">Mis Consultas</h1>

        {history.length === 0 ? (
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