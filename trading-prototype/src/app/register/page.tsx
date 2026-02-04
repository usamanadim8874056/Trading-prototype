"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const r = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [wantAdmin, setWantAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function submit() {
    setErr("");
    setOk("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        wantAdmin,
        adminCode: wantAdmin ? adminCode : "",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(data?.error || "Register failed");
      return;
    }

    setOk(`✅ Account created (${data?.role || "USER"})`);
    r.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h1 className="text-xl font-bold">Create Account</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Trading account registration
        </p>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl p-3 outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl p-3 outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* ✅ Admin Option */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="text-sm font-semibold">Register as Admin</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Requires Admin Code
              </div>
            </div>

            <input
              type="checkbox"
              checked={wantAdmin}
              onChange={(e) => setWantAdmin(e.target.checked)}
              className="h-5 w-5"
            />
          </div>

          {wantAdmin && (
            <input
              className="w-full rounded-xl p-3 outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Enter Admin Code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
          )}

          {err && <p className="text-sm text-red-500">{err}</p>}
          {ok && <p className="text-sm text-green-500">{ok}</p>}

          <button
            className="w-full rounded-xl p-3 font-bold"
            style={{ background: "var(--yellow)", color: "#111" }}
            onClick={submit}
          >
            Register
          </button>

          <Link
            href="/login"
            className="block text-center text-sm underline"
            style={{ color: "var(--muted)" }}
          >
            Already have account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
