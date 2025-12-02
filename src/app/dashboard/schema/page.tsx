"use client";

import { Suspense } from "react";
import SchemaAssistantContent from "./schema-content";

export default function SchemaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-white">Cargando esquema…</div>}>
      <SchemaAssistantContent />
    </Suspense>
  );
}