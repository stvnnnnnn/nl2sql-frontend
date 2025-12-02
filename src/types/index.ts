// ---- Tipos del usuario ----
export interface Profile {
  id: string;
  email: string;
}

// ---- Tipos del historial de consultas ----
export interface QueryHistory {
  id: string; // uuid, no number
  user_id: string;
  natural_query: string; // texto en lenguaje natural
  sql_query: string; // SQL generado
  created_at: string;
}

// ---- Para manejar sesiones en React ----
export interface SessionData {
  user: {
    id: string;
    email: string;
  };
}