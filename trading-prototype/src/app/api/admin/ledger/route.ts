import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET() {
    const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Only allow ADMIN email
  const adminEmail = process.env.ADMIN_EMAIL || "";
  const me = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!me || me.email !== adminEmail) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, usdCash: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const walletTxs = await prisma.walletTx.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const trades = await prisma.trade.findMany({
    include: { user: { select: { email: true } }, symbol: true },
    orderBy: { startAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ users, walletTxs, trades });
}
