"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  score: number;     // 0 a 4
  show: boolean;     // 👈 indica si se debe mostrar
}

export default function StrengthBar({ score, show }: Props) {
  // Paleta minimalista estilo GPT
  const colors = [
    "#dc2626", // rojo fuerte (muy débil)
    "#f97316", // naranja (débil)
    "#eab308", // amarillo (aceptable)
    "#22c55e", // verde (fuerte)
    "#16a34a", // verde más intenso (muy fuerte)
  ];

  const safeScore = Math.min(Math.max(score, 0), 4);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-2 w-full"
        >
          {/* Barra */}
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              key={safeScore}
              initial={{ width: 0 }}
              animate={{ width: `${((safeScore + 1) / 5) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                backgroundColor: colors[safeScore],
              }}
              className="h-full rounded-full"
            ></motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
