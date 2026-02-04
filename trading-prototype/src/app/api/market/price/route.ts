import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker") || "BTC/INR";

  const sym = await prisma.symbol.findUnique({ where: { ticker } });
  if (!sym) return NextResponse.json({ error: "Unknown ticker" }, { status: 404 });

  // Random walk (tune volatility here)
  const move = Math.round((Math.random() - 0.5) * 120);
  const next = clamp(sym.last + move, 1000, 10_000_000);

  const updated = await prisma.symbol.update({
    where: { ticker },
    data: { last: next },
  });

  return NextResponse.json({
    ticker: updated.ticker,
    price: updated.last,
    ts: Date.now(),
  });
}
