import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

type TF = "1m" | "5m" | "15m" | "1h" | "1d";

type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

type SimState = {
  lastTime: number;
  lastClose: number;
  drift: number; // avg move per candle (in price units)
  vol: number;   // randomness strength
  speedMs: number;
  isPaused: boolean;
  history: Candle[];
};

const g = globalThis as any;
g.__SIM__ = g.__SIM__ || new Map<string, SimState>();
const SIM: Map<string, SimState> = g.__SIM__;

function tfToSeconds(tf: TF) {
  if (tf === "1m") return 60;
  if (tf === "5m") return 300;
  if (tf === "15m") return 900;
  if (tf === "1h") return 3600;
  return 86400; // 1d
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function randn() {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function getOrInitState(key: string, start: number, tfSec: number) {
  const existing = SIM.get(key);
  if (existing) return existing;

  const now = Math.floor(Date.now() / 1000);
  const alignedNow = now - (now % tfSec);

  const s: SimState = {
    lastTime: alignedNow,
    lastClose: start,
    drift: 0,
    vol: start * 0.0015, // default vol ~0.15%
    speedMs: 1500,
    isPaused: false,
    history: [],
  };

  // Seed history with some candles
  let prev = start;
  for (let i = 100; i >= 0; i--) {
    const t = alignedNow - i * tfSec;
    const move = (Math.random() - 0.5) * s.vol;
    const open = prev;
    const close = Math.round(open + move);
    const high = Math.max(open, close) + Math.random() * s.vol * 0.5;
    const low = Math.min(open, close) - Math.random() * s.vol * 0.5;

    s.history.push({ time: t, open, high, low: Math.max(1, low), close: Math.max(1, close) });
    prev = close;
  }
  s.lastClose = prev;
  s.lastTime = alignedNow;

  SIM.set(key, s);
  return s;
}

function updateSimulation(state: SimState, tfSec: number) {
  if (state.isPaused) return;

  const now = Math.floor(Date.now() / 1000);
  const alignedNow = now - (now % tfSec);

  if (alignedNow <= state.lastTime) return;

  // Generate missing candles
  for (let t = state.lastTime + tfSec; t <= alignedNow; t += tfSec) {
    const move = state.drift + randn() * state.vol;
    const open = state.lastClose;
    const close = Math.max(1, Math.round(open + move));

    const high = Math.max(open, close) + Math.round(Math.abs(randn()) * state.vol * 0.6);
    const low = Math.max(1, Math.min(open, close) - Math.round(Math.abs(randn()) * state.vol * 0.6));

    const candle = { time: t, open, high, low, close };
    state.history.push(candle);
    state.lastClose = close;
    state.lastTime = t;

    // Keep history manageable
    if (state.history.length > 1000) state.history.shift();
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker") || "BTC/USD";
  const tf = (url.searchParams.get("tf") || "1m") as TF;

  const mode = url.searchParams.get("mode") || "sim"; // default sim for your
  const count = clamp(Number(url.searchParams.get("count") || 80), 20, 300);

  // If you later add "real" mode, you can branch here:
  if (mode !== "sim") {
    return NextResponse.json({ error: "Only sim mode enabled in this..." }, { status: 400 });
  }

  const tfSec = tfToSeconds(tf);

  // init start price based on ticker
  const start = ticker.includes("BTC") ? 42000 : ticker.includes("ETH") ? 2200 : 100;
  const key = `${ticker}:${tf}`;
  const state = getOrInitState(key, start, tfSec);

  updateSimulation(state, tfSec);

  const data = state.history.slice(-count);
  return NextResponse.json({
    candles: data,
    isPaused: state.isPaused,
    lastClose: state.lastClose
  }, { headers: { "cache-control": "no-store" } });
}

// Instructor controls (POST):
// /api/market/candles?cmd=set  body: { ticker, tf, drift, vol }
// /api/market/candles?cmd=nudge body: { ticker, tf, dir: "UP"|"DOWN", amount }
export async function POST(req: Request) {
  const url = new URL(req.url);
  const cmd = url.searchParams.get("cmd") || "";
  const body = await req.json().catch(() => ({}));

  // Require admin for any POST command that mutates the simulation
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ticker = body.ticker || "BTC/USD";
  const tf = (body.tf || "1m") as TF;
  const key = `${ticker}:${tf}`;

  const start = ticker.includes("BTC") ? 42000 : ticker.includes("ETH") ? 2200 : 100;
  const tfSec = tfToSeconds(tf);
  const state = getOrInitState(key, start, tfSec);

  if (cmd === "toggleAuto") {
    state.isPaused = !state.isPaused;
    return NextResponse.json({ ok: true, isPaused: state.isPaused });
  }

  if (cmd === "tick") {
    const dir = body.dir === "DOWN" ? "DOWN" : "UP";
    // For a tick, we move the price significantly to make it clear
    const move = (state.vol || 50) * (dir === "UP" ? 1 : -1) * (1 + Math.random() * 0.5);

    const open = state.lastClose;
    const close = Math.max(1, Math.round(open + move));
    const high = Math.max(open, close) + Math.random() * (state.vol * 0.3);
    const low = Math.max(1, Math.min(open, close) - Math.random() * (state.vol * 0.3));

    const nextTime = state.lastTime + tfSec;
    const candle = { time: nextTime, open, high, low, close };

    state.history.push(candle);
    state.lastClose = close;
    state.lastTime = nextTime;

    if (state.history.length > 1000) state.history.shift();

    return NextResponse.json({ ok: true, candle });
  }

  if (cmd === "set") {
    state.drift = Number(body.drift ?? state.drift);
    state.vol = Number(body.vol ?? state.vol);
    return NextResponse.json({ ok: true, state });
  }

  if (cmd === "nudge") {
    const dir = body.dir === "DOWN" ? "DOWN" : "UP";
    const amount = Number(body.amount ?? 100);
    state.lastClose = Math.max(1, state.lastClose + (dir === "UP" ? amount : -amount));
    return NextResponse.json({ ok: true, lastClose: state.lastClose });
  }

  return NextResponse.json({ error: "Invalid cmd" }, { status: 400 });
}
