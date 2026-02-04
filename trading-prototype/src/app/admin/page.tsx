"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const r = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await r.json();

    if (!r.ok) {
      setErr(data?.error || "Failed to load admin data");
      return;
    }
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      className="min-h-screen p-4"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {err && (
          <div className="rounded-xl border p-3 text-red-400" style={{ borderColor: "var(--border)" }}>
            {err}
          </div>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{u.email}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  Role: {u.role} • Joined: {new Date(u.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  Balance
                </div>
                <div className="text-xl font-extrabold">${u.usdCash}</div>
              </div>
            </div>

            {/* Wallet Transactions */}
            <div className="mt-4">
              <div className="font-semibold">Wallet Transactions (Last 10)</div>
              {(u.walletTxs?.length ?? 0) === 0 ? (
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  No wallet transactions
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {u.walletTxs.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="rounded-xl border p-3 text-sm"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex justify-between">
                        <div className="font-bold">{tx.type}</div>
                        <div style={{ color: "var(--muted)" }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ color: "var(--muted)" }}>
                        Amount: ${tx.amountUsd} • Status: {tx.status}
                      </div>
                      {tx.note && <div className="text-xs mt-1">{tx.note}</div>}

                            {/* Show bank/card details (for tracking) */}
                            {(tx.method || tx.bankName || tx.accountNumber || tx.cardLast4) && (
                              <div
                                className="mt-2 rounded-lg border px-3 py-2 text-xs"
                                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                              >
                                {tx.method === "BANK" && (
                                  <div className="space-y-1">
                                    <div>
                                      <span className="text-[var(--text)] font-semibold">Bank:</span>{" "}
                                      {tx.bankName || "—"}
                                    </div>
                                    <div>
                                      <span className="text-[var(--text)] font-semibold">Account Name:</span>{" "}
                                      {tx.accountName || "—"}
                                    </div>
                                    <div>
                                      <span className="text-[var(--text)] font-semibold">Account No:</span>{" "}
                                      {tx.accountNumber || "—"}
                                    </div>
                                  </div>
                                )}

                                {tx.method === "CARD" && (
                                  <div className="space-y-1">
                                    <div>
                                      <span className="text-[var(--text)] font-semibold">Card:</span>{" "}
                                      {tx.cardNumber || "—"}
                                    </div>
                                    <div>
                                      <span className="text-[var(--text)] font-semibold">Last4:</span>{" "}
                                      {tx.cardLast4 || "—"}
                                    </div>
                                  </div>
                                )}

                                {!tx.method && (
                                  <div>
                                    <span className="text-[var(--text)] font-semibold">Method:</span> —
                                  </div>
                                )}
                              </div>
                            )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trades */}
            <div className="mt-4">
              <div className="font-semibold">Trades (Last 10)</div>
              {(u.trades?.length ?? 0) === 0 ? (
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  No trades
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {u.trades.map((t: any) => (
                    <div
                      key={t.id}
                      className="rounded-xl border p-3 text-sm"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex justify-between">
                        <div className="font-bold">
                          {t.direction} • Stake ${t.stakeUsd}
                        </div>
                        <div
                          className="font-bold"
                          style={{
                            color: t.pnlUsd >= 0 ? "var(--green)" : "var(--red)",
                          }}
                        >
                          PnL: {t.pnlUsd}
                        </div>
                      </div>
                      <div style={{ color: "var(--muted)" }}>
                        Start: {t.startPrice} • End: {t.endPrice ?? "—"} • Status: {t.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
