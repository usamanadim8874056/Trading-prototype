"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CandleChart from "@/components/CandleChart";
import BottomOrderSheet from "@/components/BottomOrderSheet";
import Chip from "@/components/Chip";

type TF = "1m" | "5m" | "15m" | "1h" | "1d";
type Tab = "positions" | "history";

export default function ContractClient({ ticker }: { ticker: string }) {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [me, setMe] = useState<{ usdCash: number } | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [tf, setTf] = useState<TF>("1m");
  const [tab, setTab] = useState<Tab>("history");

  const change = useMemo(() => {
    const diff = price - prevPrice;
    const pct = prevPrice ? (diff / prevPrice) * 100 : 0;
    return { diff, pct };
  }, [price, prevPrice]);

  async function refreshAll() {
    const meRes = await fetch("/api/me", { cache: "no-store" });
    if (meRes.ok) setMe(await meRes.json());

    const pRes = await fetch(
      `/api/market/candles?mode=sim&ticker=${encodeURIComponent(ticker)}&tf=${encodeURIComponent(tf)}`,
      { cache: "no-store" }
    );

    if (pRes.ok) {
      const arr = await pRes.json();
      const last = arr[arr.length - 1]?.close;
      if (typeof last === "number") {
        setPrevPrice(price || last);
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

  const priceUp = change.diff >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium">
            ← Back
          </Link>

          <div className="text-center">
            <div className="text-xs text-[var(--muted)]">{ticker}</div>
            <div className={`text-lg font-bold ${priceUp ? "text-green-600" : "text-red-600"}`}>
              {price.toLocaleString()}
            </div>
            <div className={`text-xs ${priceUp ? "text-green-600" : "text-red-600"}`}>
              {priceUp ? "+" : ""}
              {change.diff.toFixed(0)} ({priceUp ? "+" : ""}
              {change.pct.toFixed(2)}%)
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-[var(--muted)]">Balance</div>
            <div className="text-sm font-semibold">${(me?.usdCash ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Timeframes */}
        <div className="mx-auto max-w-md px-4 pb-3 flex gap-2 overflow-x-auto">
          {(["1m", "5m", "15m", "1h", "1d"] as TF[]).map((x) => (
            <Chip key={x} active={tf === x} onClick={() => setTf(x)}>
              {x}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4 pb-28">
        {/* Chart Card */}
        <div className="rounded-2xl bg-white border shadow-sm p-3">
          <div className="rounded-xl bg-gray-100 p-2">
            <CandleChart ticker={ticker} tf={tf} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border bg-white p-2">
              <div className="text-[var(--muted)]">Pair</div>
              <div className="font-semibold">{ticker}</div>
            </div>
            <div className="rounded-xl p-2"style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-[var(--muted)]">Mode</div>
              <div className="font-semibold">Sim</div>
            </div>
            <div className="rounded-xl p-2"style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-[var(--muted)]">TF</div>
              <div className="font-semibold">{tf}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 rounded-2xl"style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex">
            <button
              type="button"
              onClick={() => setTab("positions")}
              className={`flex-1 py-3 text-sm font-semibold ${
                tab === "positions" ? "border-b-2 border-black" : "text-[var(--muted)]"
              }`}
            >
              Positions
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`flex-1 py-3 text-sm font-semibold ${
                tab === "history" ? "border-b-2 border-black" : "text-[var(--muted)]"
              }`}
            >
              History
            </button>
          </div>

          <div className="p-3">
            {tab === "positions" && (
              <div className="text-sm text-gray-600">Open trades will appear here.</div>
            )}

            {tab === "history" && (
              <div className="space-y-2">
                {trades.length === 0 && <div className="text-sm text-gray-600">No trades yet</div>}

                {trades.map((t) => (
                  <div key={t.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {t.ticker} • {t.direction === "UP" ? "Buy up" : "Buy down"}
                      </div>
                      <div
                        className={[
                          "text-xs font-semibold px-2 py-1 rounded-full",
                          t.status === "OPEN"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700",
                        ].join(" ")}
                      >
                        {t.status}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-gray-600">
                      Stake: ${t.stakeUsd} • Start: {t.startPrice} • End: {t.endPrice ?? "—"}
                    </div>

                    <div className={`mt-1 text-sm font-bold ${t.pnlUsd >= 0 ? "text-green-700" : "text-red-700"}`}>
                      PnL: {t.pnlUsd}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sticky buttons */}
      <div className="fixed bottom-0 left-0 right-0 "style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-md p-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="rounded-2xl py-3 font-semibold bg-green-600 text-white"
            onClick={() => setOpen(true)}
          >
            Buy up
          </button>
          <button
            type="button"
            className="rounded-2xl py-3 font-semibold bg-red-600 text-white"
            onClick={() => setOpen(true)}
          >
            Buy down
          </button>
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
