"use client";

import { useEffect, useState } from "react";

export default function InstructorPanel({ ticker, tf }: { ticker: string; tf: string }) {
  const [drift, setDrift] = useState(0);
  const [vol, setVol] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [msg, setMsg] = useState("");

  async function checkStatus() {
    const r = await fetch(`/api/market/candles?ticker=${ticker}&tf=${tf}`);
    const data = await r.json();
    setIsPaused(data.isPaused);
  }

  useEffect(() => {
    checkStatus();
    const id = setInterval(checkStatus, 3000);
    return () => clearInterval(id);
  }, [ticker, tf]);

  async function apply() {
    setMsg("");
    const r = await fetch("/api/market/candles?cmd=set", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, tf, drift, vol }),
    });
    if (!r.ok) setMsg("Failed to apply");
    else setMsg("Applied ✅");
    setTimeout(() => setMsg(""), 1200);
  }

  async function toggleAuto() {
    const r = await fetch("/api/market/candles?cmd=toggleAuto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, tf }),
    });
    const data = await r.json();
    setIsPaused(data.isPaused);
    setMsg(data.isPaused ? "Auto-gen Paused ⏸️" : "Auto-gen Resumed ▶️");
    setTimeout(() => setMsg(""), 2000);
  }

  async function tick(dir: "UP" | "DOWN") {
    setMsg(`Ticking ${dir}...`);
    const r = await fetch("/api/market/candles?cmd=tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, tf, dir }),
    });
    if (r.ok) setMsg(`Generated ${dir} candle ✅`);
    else setMsg("Tick failed");
    setTimeout(() => setMsg(""), 2000);
  }

  // keyboard: ArrowUp / ArrowDown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") tick("UP");
      if (e.key === "ArrowDown") tick("DOWN");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ticker, tf]);

  return (
    <div
      className="rounded-3xl p-4 shadow-2xl"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-extrabold text-lg flex items-center gap-2">
            Control Panel
            <span
              className={`w-2 h-2 rounded-full ${isPaused ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
            />
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--muted)" }}>
            SIMULATION ENGINE v2.0
          </div>
        </div>
        {msg && <div className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#0f1419", color: "var(--yellow)" }}>{msg}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase pl-1" style={{ color: "var(--muted)" }}>Trend Drift</div>
          <input
            className="w-full rounded-2xl border px-4 py-3 bg-[#0f1419] font-mono text-sm focus:outline-none focus:border-[var(--yellow)] transition-colors"
            style={{ borderColor: "var(--border)" }}
            type="number"
            value={drift}
            onChange={(e) => setDrift(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase pl-1" style={{ color: "var(--muted)" }}>Volatility</div>
          <input
            className="w-full rounded-2xl border px-4 py-3 bg-[#0f1419] font-mono text-sm focus:outline-none focus:border-[var(--yellow)] transition-colors"
            style={{ borderColor: "var(--border)" }}
            type="number"
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="rounded-2xl py-3 font-extrabold transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
          style={{ background: isPaused ? "var(--green)" : "#1e2329", color: isPaused ? "#000" : "#fff" }}
          onClick={toggleAuto}
        >
          {isPaused ? "▶ RESUME AUTO" : "⏸ PAUSE AUTO"}
        </button>

        <button
          className="rounded-2xl py-3 font-extrabold bg-[var(--yellow)] text-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
          onClick={apply}
        >
          SET PARAMS
        </button>
      </div>

      <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Manual Candle Generation</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="group relative flex items-center justify-center gap-2 rounded-2xl py-4 font-black transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
            style={{ background: "rgba(14,203,129,0.1)", border: "1px solid var(--green)", color: "var(--green)" }}
            onClick={() => tick("UP")}
          >
            <span className="text-xl">▲</span>
            GENERATE GREEN
            <div className="absolute inset-0 bg-green-500/10 group-hover:opacity-100 opacity-0 transition-opacity" />
          </button>

          <button
            className="group relative flex items-center justify-center gap-2 rounded-2xl py-4 font-black transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
            style={{ background: "rgba(246,70,93,0.1)", border: "1px solid var(--red)", color: "var(--red)" }}
            onClick={() => tick("DOWN")}
          >
            <span className="text-xl">▼</span>
            GENERATE RED
            <div className="absolute inset-0 bg-red-500/10 group-hover:opacity-100 opacity-0 transition-opacity" />
          </button>
        </div>
        <div className="mt-3 text-center text-[10px] font-bold flex items-center justify-center gap-2" style={{ color: "var(--muted)" }}>
          <span className="px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)" }}>↑</span>
          <span className="px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)" }}>↓</span>
          HOTKEYS ENABLED
        </div>
      </div>
    </div>
  );
}
