"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const ticker = sp.get("ticker") || "BTC/USD";

  const isActive = (key: "home" | "markets" | "trade" | "wallet") => {
    if (key === "home") return pathname === "/";
    if (key === "markets") return pathname === "/" || pathname.startsWith("/markets");
    if (key === "trade") return pathname.startsWith("/contract"); // ✅ trade active everywhere in contract
    if (key === "wallet") return pathname.startsWith("/wallet");
    return false;
  };

  const items = [
    { key: "home", href: "/", label: "Home" },
    { key: "markets", href: "/#markets", label: "Markets" },
    { key: "trade", href: `/contract/trade?ticker=${encodeURIComponent(ticker)}`, label: "Trade" },
    { key: "wallet", href: "/wallet", label: "Wallet" },
  ] as const;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map((x) => {
          const active = isActive(x.key);
          return (
            <Link
              key={x.key}
              href={x.href}
              className="py-3 text-center text-xs font-semibold"
              style={{ color: active ? "var(--yellow)" : "var(--muted)" }}
            >
              {x.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
