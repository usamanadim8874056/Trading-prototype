"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CandleChart from "@/components/CandleChart";
import BottomOrderSheet from "@/components/BottomOrderSheet";
import Chip from "@/components/Chip";
import InstructorPanel from "@/components/InstructorPanel";


type TF = "1m" | "5m" | "15m" | "1h" | "1d";

export default function TradePage() {
  const sp = useSearchParams();
  const ticker = sp.get("ticker") || "BTC/USD";

  const [price, setPrice] = useState<number>(42000);
  const [prevPrice, setPrevPrice] = useState<number>(42000);
  const [me, setMe] = useState<any | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [tf, setTf] = useState<TF>("1m");

  const change = useMemo(() => {
    const diff = price - prevPrice;
    const pct = prevPrice ? (diff / prevPrice) * 100 : 0;
    return { diff, pct };
  }, [price, prevPrice]);

  async function refreshAll() {
    const meRes = await fetch("/api/me", { cache: "no-store" });
    if (meRes.ok) setMe(await meRes.json());

    const pRes = await fetch(
      `/api/market/candles?mode=sim&ticker=${encodeURIComponent(ticker)}&tf=${encodeURIComponent(tf)}`
      ,
      { cache: "no-store" }
    );

    if (pRes.ok) {
      const json = await pRes.json();
      const last = json.lastClose;
      if (typeof last === "number") {
        setPrevPrice(price);
        setPrice(last);
      }
    }

    const tRes = await fetch("/api/trades/list", { cache: "no-store" });
    if (tRes.ok) setTrades(await tRes.json());
  }

  useEffect(() => {
    refreshAll();
    const id = setInterval(refreshAll, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf, ticker]);

  const up = change.diff >= 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ===== Binance Futures Style Header ===== */}
      <div
        className="sticky top-0 z-30"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: "var(--muted)" }}
          >
            ←
          </Link>

          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              {ticker}
            </div>

            <div className="flex items-baseline gap-2">
              <div
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: up ? "var(--green)" : "var(--red)" }}
              >
                ${price.toLocaleString("en-US")}
              </div>

              <div
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  background: up ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
                  color: up ? "var(--green)" : "var(--red)",
                  border: `1px solid ${up ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
                }}
              >
                {up ? "+" : ""}
                {change.pct.toFixed(2)}%
              </div>
            </div>

            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              {up ? "+" : ""}
              {change.diff.toFixed(0)} USD
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              Available
            </div>
            <div className="text-sm font-bold">
              ${Number(me?.usdCash ?? 0).toLocaleString("en-US")}
            </div>
          </div>
        </div>

        {/* TF row like Binance */}
        <div className="max-w-md mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(["1m", "5m", "15m", "1h", "1d"] as TF[]).map((x) => (
            <Chip key={x} active={tf === x} onClick={() => setTf(x)}>
              {x}
            </Chip>
          ))}
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="max-w-md mx-auto px-4 py-4 pb-28 space-y-4">
        {/* ===== Chart Card ===== */}
        <div
          className="rounded-3xl p-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >

          {/* Small top row like Binance */}
          <div className="flex items-center justify-between pb-2">
            <div className="text-sm font-bold">Chart</div>

            <div
              className="text-[11px] px-2 py-1 rounded-full"
              style={{
                background: "#0f1419",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              Beast Mode
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1419" }}>
            <CandleChart ticker={ticker} tf={tf} />
          </div>

          {/* Market Stats (Binance style) */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div
              className="rounded-2xl p-2"
              style={{ background: "#0f1419", border: "1px solid var(--border)" }}
            >
              <div style={{ color: "var(--muted)" }}>Pair</div>
              <div className="font-bold">{ticker}</div>
            </div>

            <div
              className="rounded-2xl p-2"
              style={{ background: "#0f1419", border: "1px solid var(--border)" }}
            >
              <div style={{ color: "var(--muted)" }}>Timeframe</div>
              <div className="font-bold">{tf}</div>
            </div>

            <div
              className="rounded-2xl p-2"
              style={{ background: "#0f1419", border: "1px solid var(--border)" }}
            >
              <div style={{ color: "var(--muted)" }}>Trades</div>
              <div className="font-bold">{trades.length}</div>
            </div>
          </div>
        </div>
        {/* ===== Simulation Controls ===== */}
        <div className="space-y-2">
          <div className="text-xs font-semibold" style={{ color: "var(--yellow)" }}>
            SIMULATION MODE • Use ArrowUp / ArrowDown to nudge price
          </div>

          {me?.role === "ADMIN" && <InstructorPanel ticker={ticker} tf={tf} />}
        </div>


        {/* ===== History Section ===== */}
        <div
          className="rounded-3xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="font-bold">Trade History</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Latest first
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {trades.length === 0 && (
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                No trades yet. Place your first order 👇
              </div>
            )}

            {trades.map((t) => {
              const profit = Number(t.pnlUsd ?? 0);
              const profitUp = profit >= 0;

              return (
                <div
                  key={t.id}
                  className="rounded-2xl p-3"
                  style={{ background: "#0f1419", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">
                      {t.ticker} • {t.direction === "UP" ? "Buy up" : "Buy down"}
                    </div>

                    <div
                      className="text-[11px] font-bold px-2 py-1 rounded-full"
                      style={{
                        background:
                          t.status === "OPEN"
                            ? "rgba(240,185,11,0.10)"
                            : "rgba(14,203,129,0.10)",
                        color:
                          t.status === "OPEN" ? "var(--yellow)" : "var(--green)",
                        border:
                          t.status === "OPEN"
                            ? "1px solid rgba(240,185,11,0.25)"
                            : "1px solid rgba(14,203,129,0.25)",
                      }}
                    >
                      {t.status}
                    </div>
                  </div>

                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    Stake: ${t.stakeUsd} • Start: {t.startPrice} • End: {t.endPrice ?? "—"}
                  </div>

                  <div
                    className="mt-1 text-sm font-extrabold"
                    style={{ color: profitUp ? "var(--green)" : "var(--red)" }}
                  >
                    PnL: {profitUp ? "+" : ""}
                    ${profit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Binance Style Bottom Action Bar ===== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-md mx-auto px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-2xl py-3 font-extrabold"
              style={{
                background: "var(--green)",
                color: "#08110c",
              }}
            >
              Buy / Long
            </button>

            <button
              onClick={() => setOpen(true)}
              className="rounded-2xl py-3 font-extrabold"
              style={{
                background: "var(--red)",
                color: "#14070a",
              }}
            >
              Sell / Short
            </button>
          </div>

          <div className="mt-2 text-center text-[11px]" style={{ color: "var(--muted)" }}>
            Trading • Orders settle automatically
          </div>
        </div>
      </div>

      <BottomOrderSheet
        open={open}
        onClose={() => setOpen(false)}
        ticker={ticker}
        inrAvailable={me?.usdCash ?? 0}
        onPlaced={refreshAll}
      />
    </div>
  );
}
