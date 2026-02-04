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

  // ✅ check current user is admin
  const me = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // ✅ Fetch all users with transactions + trades
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      usdCash: true,
      role: true,
      createdAt: true,
      walletTxs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            type: true,
            amountUsd: true,
            status: true,
            note: true,
            createdAt: true,
            method: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            cardNumber: true,
            cardLast4: true,
        },
        },

    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
