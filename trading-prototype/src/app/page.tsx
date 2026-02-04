"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BCard from "@/components/BCard";

export default function Home() {
  const [me, setMe] = useState<{ email: string; usdCash: number } | null>(null);
  const [symbols, setSymbols] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => setMe(null));

    fetch("/api/market/symbols", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSymbols(d))
      .catch(() => setSymbols([]));
  }, []);

  if (!me?.email) {
    return (
      <div className="max-w-md mx-auto p-4">
        <BCard>
          <div className="text-lg font-bold">You are not logged in</div>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Login to use the trading.
          </p>

          <Link
            href="/login"
            className="mt-4 block text-center rounded-2xl py-3 font-bold"
            style={{ background: "var(--yellow)", color: "#000" }}
          >
            Go to Login
          </Link>
        </BCard>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Welcome
          </div>
          <div className="text-xl font-extrabold">Asset Overview</div>
        </div>

        <Link
          href={`/contract/trade?ticker=${encodeURIComponent("BTC/USD")}`}
          className="rounded-2xl px-4 py-2 text-sm font-bold"
          style={{ background: "var(--yellow)", color: "#000" }}
        >
          Trade
        </Link>
      </div>

      {/* Balance Card */}
      <div
        className="rounded-3xl p-5 shadow-md"
        style={{
          background: "linear-gradient(135deg, #1E2329, #0B0E11)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Balance (USD)
        </div>
        <div className="text-4xl font-extrabold mt-2">
          ${me.usdCash.toLocaleString("en-US")}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/wallet"
            className="rounded-2xl py-3 text-center font-bold"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Top Up
          </Link>

          <Link
            href="/wallet"
            className="rounded-2xl py-3 text-center font-bold"
            style={{
              background: "var(--yellow)",
              color: "#000",
            }}
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* Markets */}
      <BCard>
        <div className="flex items-center justify-between">
          <div className="font-bold text-base">Markets</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Prices
          </div>
        </div>

        <div className="mt-3 space-y-3" id="markets">
          {symbols.map((s) => (
            <div
              key={s.ticker}
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ border: "1px solid var(--border)" }}
            >
              <div>
                <div className="text-lg font-extrabold">{s.ticker}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {s.name}
                </div>
                <div className="text-sm font-bold mt-1">
                  ${Number(s.last).toLocaleString("en-US")}
                </div>
              </div>

              <Link
                href={`/contract/trade?ticker=${encodeURIComponent(s.ticker)}`}
                className="rounded-xl px-4 py-2 text-sm font-bold"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--yellow)",
                }}
              >
                Open
              </Link>
            </div>
          ))}
          <Link href="/admin" className="text-sm font-bold text-[var(--yellow)]">
            Admin Panel
        </Link>
        </div>
      </BCard>
    </div>
  );
}
