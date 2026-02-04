"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || "Login failed");
    r.replace("/");
    r.refresh();

  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border p-4">
        <h1 className="text-xl font-semibold">Login</h1>
        <div className="mt-3 space-y-2">
          <input className="w-full border rounded-xl p-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-xl p-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="w-full rounded-xl p-3 border bg-black text-white" onClick={submit}>Sign in</button>
          <button className="w-full rounded-xl p-3 border" onClick={()=>r.push("/register")}>Create account</button>
        </div>
      </div>
    </div>
  );
}
