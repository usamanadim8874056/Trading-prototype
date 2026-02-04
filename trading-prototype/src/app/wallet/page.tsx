"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WalletPage() {
  const [me, setMe] = useState<{ usdCash: number } | null>(null);

  const [method, setMethod] = useState<"BANK" | "CARD">("BANK");
  const [amount, setAmount] = useState(100);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [msg, setMsg] = useState("");

  async function refreshMe() {
    const r = await fetch("/api/me", { cache: "no-store" });
    if (r.ok) setMe(await r.json());
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function topup() {
    setMsg("");
    const r = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        amount,
        bankName,
        accountName,
        accountNumber,
        cardNumber,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(data?.error || "Topup failed");
      return;
    }

    setMsg("✅ Top up successful");
    refreshMe();
  }

  async function withdraw() {
    setMsg("");
    const r = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        amount,
        bankName,
        accountName,
        accountNumber,
        cardNumber,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(data?.error || "Withdraw failed");
      return;
    }

    setMsg("✅ Withdraw successful");
    refreshMe();
  }

  const inputClass =
    "w-full rounded-2xl px-4 py-3 text-sm outline-none transition " +
    "placeholder:text-[var(--muted)] " +
    "border border-[var(--border)] bg-[#0f1419] text-[var(--text)] " +
    "focus:border-[var(--yellow)]";

  const labelClass = "text-xs font-medium text-[var(--muted)]";

  const pillBase =
    "flex-1 rounded-2xl py-2.5 text-sm font-semibold border transition";

  const pillActive =
    "bg-[var(--yellow)] text-black border-[var(--yellow)]";

  const pillInactive =
    "bg-transparent text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-md px-4 py-4 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: "var(--muted)" }}
          >
            ← Back
          </Link>

          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Wallet
            </div>
            <div className="text-lg font-bold">Deposit / Withdraw</div>
          </div>

          <div className="w-10" />
        </div>

        {/* Balance Card */}
        <div
          className="mt-4 rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          style={{
            background: "linear-gradient(180deg, #1E2329 0%, #0B0E11 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Balance (USD)
          </div>

          <div className="mt-1 text-4xl font-extrabold tracking-tight">
            ${(me?.usdCash ?? 0).toLocaleString()}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={topup}
              className="rounded-2xl py-3 font-bold"
              style={{
                background: "var(--yellow)",
                color: "#000",
              }}
            >
              Top Up
            </button>

            <button
              type="button"
              onClick={withdraw}
              className="rounded-2xl py-3 font-bold"
              style={{
                background: "#0f1419",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Withdraw
            </button>
          </div>

          {msg && (
            <div className="mt-3 text-center text-sm" style={{ color: "var(--yellow)" }}>
              {msg}
            </div>
          )}
        </div>

        {/* Form Card */}
        <div
          className="mt-4 rounded-3xl p-5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold">Payment Method</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                (contact with Dealer)
              </div>
            </div>

            <div
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: "#0f1419",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              Secure
            </div>
          </div>

          {/* BANK / CARD pills */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={`${pillBase} ${method === "BANK" ? pillActive : pillInactive}`}
              onClick={() => setMethod("BANK")}
            >
              Bank
            </button>
            <button
              type="button"
              className={`${pillBase} ${method === "CARD" ? pillActive : pillInactive}`}
              onClick={() => setMethod("CARD")}
            >
              Card
            </button>
          </div>

          {/* Amount */}
          <div className="mt-4 grid gap-2">
            <label className={labelClass}>Amount (USD)</label>
            <input
              className={inputClass}
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
            />
          </div>

          {/* BANK fields */}
          {method === "BANK" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <label className={labelClass}>Bank Name</label>
                <input
                  className={inputClass}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HBL / UBL / Chase"
                />
              </div>

              <div className="grid gap-2">
                <label className={labelClass}>Account Holder Name</label>
                <input
                  className={inputClass}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <label className={labelClass}>Account Number</label>
                <input
                  className={inputClass}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234-5678-9012"
                />
              </div>
            </div>
          )}

          {/* CARD field */}
          {method === "CARD" && (
            <div className="mt-4 grid gap-2">
              <label className={labelClass}>Card / ATM Number</label>
              <input
                className={inputClass}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="XXXX XXXX XXXX XXXX"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={topup}
              className="rounded-2xl py-3 font-extrabold"
              style={{
                background: "var(--yellow)",
                color: "#000",
              }}
            >
              Confirm Top Up
            </button>

            <button
              type="button"
              onClick={withdraw}
              className="rounded-2xl py-3 font-extrabold"
              style={{
                background: "#0f1419",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Confirm Withdraw
            </button>
          </div>

          {/* Helper */}
          <div className="mt-4 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            ⚠️ This is a <b>wallet</b>. In a real app, deposits/withdrawals require a payment gateway
            and bank integrations (Stripe, PayPal, Plaid, etc).
          </div>
        </div>
      </div>
      <button
        className="w-full mt-3 rounded-2xl py-3 font-bold"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--yellow)" }}
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login"; // ✅ hard redirect
        }}>
        Logout
    </button>

    </div>
  );
}
