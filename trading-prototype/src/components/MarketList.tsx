"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MarketList() {
  const [symbols, setSymbols] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/market/symbols", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSymbols(d))
      .catch(() => setSymbols([]));
  }, []);

  return (
    <div className="mt-3 space-y-3">
      {symbols.map((s) => {
        const route = s.ticker.toLowerCase().replace("/", "");
        return (
          <div key={s.ticker} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-semibold">{s.ticker}</div>
              <div className="text-xs text-[var(--muted)]">{s.name}</div>
              <div className="text-xs mt-1">${Number(s.last).toLocaleString()}</div>
            </div>

            <Link
                className="rounded-xl border px-3 py-2 text-sm"
                href={`/contract/trade?ticker=${encodeURIComponent(s.ticker)}`}>
                Open
            </Link>
          </div>
        );
      })}

      {symbols.length === 0 && <div className="text-sm text-[var(--muted)]">Loading markets...</div>}
    </div>
  );
}
