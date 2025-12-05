export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

/**
 * apiFetch envía cookies automáticamente (JWT HttpOnly)
 * y serializa JSON para todas las llamadas a tu backend.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // 🔥 IMPORTANTE: envía cookies JWT
  };

  const res = await fetch(`${BACKEND_URL}${path}`, finalOptions);
  return res;
}