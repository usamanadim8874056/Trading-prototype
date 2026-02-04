"use client";

import { useEffect, useMemo, useState } from "react";

type Dir = "UP" | "DOWN";

export default function BottomOrderSheet({
  open,
  onClose,
  ticker,
  inrAvailable,
  onPlaced,
}: {
  open: boolean;
  onClose: () => void;
  ticker: string;
  inrAvailable: number;
  onPlaced: () => Promise<void> | void;
}) {
  const [durationSec, setDurationSec] = useState<number>(60);
  const [stake, setStake] = useState<number>(100);
  const [err, setErr] = useState<string>("");

  const durations = useMemo(() => [60, 120, 180, 240], []);
  const percents = useMemo(() => [10, 25, 50, 75, 100], []);
  const presets = useMemo(() => [10, 25, 50, 100, 250, 500, 1000], []);

  useEffect(() => {
    if (!open) return;
    setErr("");
    if (stake <= 0) setStake(100);
  }, [open]);

  async function place(direction: Dir) {
    setErr("");

    const s = Number(stake);
    if (!Number.isFinite(s) || s <= 0) return setErr("Enter valid amount");
    if (s > inrAvailable) return setErr("Insufficient USD balance");

    const res = await fetch("/api/trades/place", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, direction, stakeInr: s, durationSec }),
    });

    const data = await res.json();
    if (!res.ok) return setErr(data.error || "Failed to place trade");

    await onPlaced();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div
          className="w-full max-w-md rounded-t-3xl p-4 shadow-2xl animate-[slideUp_.18s_ease-out]"
          style={{
            background: "var(--card)",
            borderTop: `1px solid var(--border)`,
            color: "var(--text)",
          }}
        >
          {/* Handle */}
          <div
            className="mx-auto mb-3 h-1.5 w-12 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">{ticker}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Futures • Order
              </div>
            </div>

            <button
              className="text-xl leading-none px-2"
              style={{ color: "var(--muted)" }}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* Balance */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div style={{ color: "var(--muted)" }}>Available (USD)</div>
            <div className="font-bold">${inrAvailable.toLocaleString("en-US")}</div>
          </div>

          {/* Duration */}
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Expiry
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {durations.map((d) => {
                const active = durationSec === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDurationSec(d)}
                    className="rounded-xl py-2 text-xs font-semibold transition"
                    style={{
                      background: active ? "rgba(240,185,11,0.15)" : "#0f1419",
                      border: `1px solid ${
                        active ? "rgba(240,185,11,0.35)" : "var(--border)"
                      }`,
                      color: active ? "var(--yellow)" : "var(--muted)",
                    }}
                  >
                    {d}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Percent row */}
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Use Balance %
            </div>

            <div className="mt-2 grid grid-cols-5 gap-2">
              {percents.map((p) => (
                <button
                  key={p}
                  className="rounded-xl py-2 text-[11px] font-semibold"
                  style={{
                    background: "#0f1419",
                    border: `1px solid var(--border)`,
                    color: "var(--muted)",
                  }}
                  onClick={() =>
                    setStake(Math.max(1, Math.floor((inrAvailable * p) / 100)))
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                Amount (USD)
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Min 1
              </div>
            </div>

            <div
              className="mt-2 flex items-center gap-2 rounded-2xl px-3"
              style={{
                background: "#0f1419",
                border: `1px solid var(--border)`,
              }}
            >
              <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>
                $
              </span>

              <input
                className="w-full bg-transparent py-3 text-sm outline-none"
                style={{ color: "var(--text)" }}
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                placeholder="Enter amount"
              />
            </div>

            {/* presets */}
            <div className="mt-2 grid grid-cols-4 gap-2">
              {presets.map((a) => (
                <button
                  key={a}
                  className="rounded-xl py-2 text-xs font-semibold transition"
                  style={{
                    background: stake === a ? "rgba(240,185,11,0.15)" : "#0f1419",
                    border: `1px solid ${
                      stake === a ? "rgba(240,185,11,0.35)" : "var(--border)"
                    }`,
                    color: stake === a ? "var(--yellow)" : "var(--muted)",
                  }}
                  onClick={() => setStake(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {err && (
            <div
              className="mt-3 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{
                background: "rgba(246,70,93,0.12)",
                border: "1px solid rgba(246,70,93,0.35)",
                color: "var(--red)",
              }}
            >
              {err}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="rounded-2xl py-3 font-extrabold"
              style={{ background: "var(--green)", color: "#07110c" }}
              onClick={() => place("UP")}
            >
              Buy / Long
            </button>

            <button
              className="rounded-2xl py-3 font-extrabold"
              style={{ background: "var(--red)", color: "#15070a" }}
              onClick={() => place("DOWN")}
            >
              Sell / Short
            </button>
          </div>

          <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
            Orders settle automatically after expiry.
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(18px);
            opacity: 0.7;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
