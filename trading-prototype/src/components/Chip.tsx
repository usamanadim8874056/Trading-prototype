"use client";

export default function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
      style={{
        background: active ? "rgba(240,185,11,0.15)" : "transparent",
        border: `1px solid ${active ? "rgba(240,185,11,0.35)" : "var(--border)"}`,
        color: active ? "var(--yellow)" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}
