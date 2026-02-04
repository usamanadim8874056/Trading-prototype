export default function BCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}
