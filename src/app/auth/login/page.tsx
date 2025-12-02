"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // si todo ok → al dashboard
    if (data.session) {
      router.push("/dashboard");
    } else {
      setError("Email not confirmed. Revisa tu bandeja de correo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900/95 px-10 py-9 shadow-2xl border border-neutral-800">
        <h1 className="mb-6 text-center text-3xl font-semibold tracking-tight">
          Iniciar Sesión
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-white/70 transition"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-white/70 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition
            hover:bg-neutral-200 active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {loading ? (
              <>
                <Spinner />
                <span>Iniciando sesión…</span>
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿No tienes una cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/register")}
            className="text-white hover:underline"
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}