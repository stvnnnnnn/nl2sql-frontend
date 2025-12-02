"use client";

export default function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
      aria-hidden="true"
    />
  );
}