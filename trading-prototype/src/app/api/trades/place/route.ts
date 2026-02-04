import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker, direction, stakeInr, durationSec } = await req.json();

  if (!ticker || !direction || !stakeInr || !durationSec) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!["UP", "DOWN"].includes(direction)) {
    return NextResponse.json({ error: "Bad direction" }, { status: 400 });
  }

  const stake = Number(stakeInr);
  const dur = Number(durationSec);

  if (!Number.isFinite(stake) || stake <= 0) return NextResponse.json({ error: "Bad stake" }, { status: 400 });
  if (![60, 120, 180, 240].includes(dur)) return NextResponse.json({ error: "Bad duration" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.usdCash < stake) return NextResponse.json({ error: "Insufficient INR" }, { status: 400 });

  const sym = await prisma.symbol.findUnique({ where: { ticker } });
  if (!sym) return NextResponse.json({ error: "Unknown ticker" }, { status: 404 });

  const endAt = new Date(Date.now() + dur * 1000);

  const trade = await prisma.$transaction(async (tx) => {
    // lock funds (debit now)
    await tx.user.update({
      where: { id: user.id },
      data: { usdCash: { decrement: stake } },
    });

    return tx.trade.create({
      data: {
        userId: user.id,
        symbolId: sym.id,
        direction,
        stakeUsd: stake,
        startPrice: sym.last,
        endAt,
      },
    });
  });

  return NextResponse.json({ ok: true, tradeId: trade.id });
}
