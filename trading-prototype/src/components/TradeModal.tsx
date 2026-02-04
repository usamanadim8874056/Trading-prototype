"use client";
import { useState } from "react";

export function TradeModal({
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
  onPlaced: () => void;
}) {
  const [durationSec, setDurationSec] = useState(60);
  const [stake, setStake] = useState(1000);
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [err, setErr] = useState("");

  if (!open) return null;

  async function place() {
    setErr("");
    const res = await fetch("/api/trades/place", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, direction, stakeInr: stake, durationSec }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || "Failed");
    onPlaced();
    onClose();
  }

  const presets = [100, 500, 1000, 5000, 10000, 50000];
  const percents = [10, 30, 50, 70, 100];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{ticker}</div>
          <button className="text-xl" onClick={onClose}>×</button>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium">Order Type</div>
          <div className="mt-2 flex gap-2">
            {[60, 120, 180, 240].map((d) => (
              <button
                key={d}
                className={`rounded-xl border px-3 py-2 text-sm ${durationSec === d ? "bg-black text-white" : ""}`}
                onClick={() => setDurationSec(d)}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm opacity-70">
            USD Available: {inrAvailable.toLocaleString("en-US")}
          </div>

          <div className="mt-2 flex gap-2 flex-wrap">
            {percents.map((p) => (
              <button
                key={p}
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => setStake(Math.max(1, Math.floor((inrAvailable * p) / 100)))}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium">Amount</div>
          <input
            className="mt-2 w-full rounded-xl border p-3"
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />
          <div className="mt-2 flex gap-2 flex-wrap">
            {presets.map((a) => (
              <button
                key={a}
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => setStake(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-xl p-3 border ${direction === "UP" ? "bg-green-600 text-white" : ""}`}
            onClick={() => setDirection("UP")}
          >
            Buy up
          </button>
          <button
            className={`rounded-xl p-3 border ${direction === "DOWN" ? "bg-red-600 text-white" : ""}`}
            onClick={() => setDirection("DOWN")}
          >
            Buy down
          </button>
        </div>

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        <button
          className="mt-3 w-full rounded-xl p-3 border bg-black text-white"
          onClick={place}
        >
          Place trade
        </button>
      </div>
    </div>
  );
}
