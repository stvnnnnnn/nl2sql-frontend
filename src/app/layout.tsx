// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NL2SQL",
  description: "Intérprete semántico NL → SQL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0D0D0D] text-white antialiased">
        {children}
      </body>
    </html>
  );
}