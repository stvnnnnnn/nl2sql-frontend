"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Spinner from "@/components/Spinner";
import StrengthBar from "@/components/StrengthBar";

// -----------------------------
// VALIDACIONES
// -----------------------------
function validateEmail(email: string): boolean {
  const regex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
  return regex.test(email);
}

function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*._-]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);

  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("El correo no es válido.");
      return;
    }

    if (strength < 3) {
      setError("La contraseña es demasiado débil.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? "Error al registrar usuario.");
      setLoading(false);
      return;
    }

    alert("Cuenta creada correctamente.");
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900/95 px-10 py-9 shadow-2xl border border-neutral-800">
        <h1 className="mb-6 text-center text-3xl font-semibold tracking-tight">
          Registrarse
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailValid(validateEmail(e.target.value));
              }}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-white/70 transition"
              placeholder="tu@correo.com"
            />

            {email.length > 0 && (
              <p
                className={`text-xs mt-1 transition ${
                  emailValid ? "text-green-400" : "text-red-400"
                }`}
              >
                {emailValid ? "Correo válido ✓" : "Correo no válido"}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setStrength(passwordStrength(e.target.value));
              }}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-white/70 transition"
              placeholder="••••••••"
            />

            {/* Barra de fuerza */}
            <StrengthBar score={strength} show={password.length > 0} />

            {/* Texto dinámico */}
            {password.length > 0 && (
              <p className="text-xs text-neutral-400 mt-1">
                {strength === 0 && "Muy débil"}
                {strength === 1 && "Débil"}
                {strength === 2 && "Aceptable"}
                {strength === 3 && "Fuerte ✓"}
                {strength === 4 && "Muy fuerte ✓"}
              </p>
            )}
          </div>

          {/* CONFIRM */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">
              Confirmar contraseña
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-white/70 transition"
              placeholder="Repite la contraseña"
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner />
                <span>Creando cuenta…</span>
              </>
            ) : (
              "Registrarse"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿Ya tienes una cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-white hover:underline"
          >
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  );
}