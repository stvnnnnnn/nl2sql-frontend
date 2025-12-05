"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/api";
import axios from "axios";

interface User {
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================================
  // VALIDAR SESIÓN CON /auth/me
  // ============================================
  useEffect(() => {
    async function validate() {
      try {
        const res = await axios.get(`${BACKEND_URL}/auth/me`, {
          withCredentials: true,
        });

        setUser(res.data);
      } catch {
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    }

    validate();
  }, [router]);

  async function logout() {
    await axios.post(
      `${BACKEND_URL}/auth/logout`,
      {},
      { withCredentials: true }
    );
    router.replace("/auth/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }

  if (!user) return null;

  // Inicial del usuario
  const initial = user.email?.charAt(0).toUpperCase() || "?";

  // Greeting dinámico estilo GPT
    const hour = new Date().getHours();
    let greeting = "Hola";

    if (hour < 12) greeting = "Buenos días";
    else if (hour < 18) greeting = "Buenas tardes";
    else greeting = "Buenas noches";

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-white">
      {/* =========================== */}
      {/* TOP NAVBAR */}
      {/* =========================== */}
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-6">
        {/* SALUDO GPT-STYLE */}
        <div className="overflow-hidden">
            <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col"
            >
            <span className="text-xs text-neutral-500 tracking-wide">
                {greeting}
            </span>

            <h1 className="text-lg font-semibold tracking-tight mt-0.5">
                Bienvenido, <span className="text-neutral-300">{user.email}</span>
            </h1>
            </motion.div>
        </div>

        {/* AVATAR */}
        <div className="relative">
            <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition"
            >
            <span className="font-semibold">{initial}</span>
            </button>

            {menuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1"
            >
                <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                >
                Cerrar sesión
                </button>
            </motion.div>
            )}
        </div>
        </header>

      {/* =========================== */}
      {/* CONTENIDO DEL DASHBOARD */}
      {/* =========================== */}
      <main className="flex-1">{children}</main>
    </div>
  );
}