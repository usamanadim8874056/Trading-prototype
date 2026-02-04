import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Find expired OPEN trades
  const expired = await prisma.trade.findMany({
    where: { userId: payload.userId, status: "OPEN", endAt: { lte: now } },
    include: { symbol: true },
  });

  for (const t of expired) {
    const sym = await prisma.symbol.findUnique({ where: { id: t.symbolId } });
    if (!sym) continue;

    const endPrice = sym.last;

    // WIN condition:
    const win = t.direction === "UP" ? endPrice > t.startPrice : endPrice < t.startPrice;

    // Payout model for prototype:
    // - lose => payout 0
    // - win  => payout stake + 80% profit
    const payout = win ? Math.round(t.stakeUsd * 1.8) : 0;
    const pnl = payout - t.stakeUsd;

    await prisma.$transaction(async (tx) => {
      await tx.trade.update({
        where: { id: t.id },
        data: {
          status: "SETTLED",
          endPrice,
          pnlUsd: pnl,
        },
      });

      if (payout > 0) {
        await tx.user.update({
          where: { id: payload.userId },
          data: { usdCash: { increment: payout } },
        });
      }
    });
  }

  const trades = await prisma.trade.findMany({
    where: { userId: payload.userId },
    orderBy: { startAt: "desc" },
    take: 50,
    include: { symbol: true },
  });

  return NextResponse.json(
    trades.map((t) => ({
      id: t.id,
      ticker: t.symbol.ticker,
      direction: t.direction,
      stakeUsd: t.stakeUsd,
      startPrice: t.startPrice,
      endPrice: t.endPrice,
      startAt: t.startAt,
      endAt: t.endAt,
      status: t.status,
      pnlUsd: t.pnlUsd,
    }))
  );
}
