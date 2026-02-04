import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const method = String(body?.method || "BANK"); // BANK | CARD
  const amount = Number(body?.amount ?? 0);

  const bankName = String(body?.bankName || "");
  const accountName = String(body?.accountName || "");
  const accountNumber = String(body?.accountNumber || "");
  const cardNumber = String(body?.cardNumber || "");

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // ✅ save last4 only
  const cardLast4 = cardNumber ? cardNumber.replace(/\s/g, "").slice(-4) : null;

  const updated = await prisma.$transaction(async (tx) => {
    // Add money to balance
    const user = await tx.user.update({
      where: { id: payload.userId },
      data: { usdCash: { increment: amount } },
      select: { usdCash: true },
    });

    // ✅ store wallet tx + details
    await tx.walletTx.create({
      data: {
        userId: payload.userId,
        type: "DEPOSIT",
        amountUsd: amount,
        status: "SUCCESS",
        note: "Top up",

        method,
        bankName: method === "BANK" ? bankName : null,
        accountName: method === "BANK" ? accountName : null,
        accountNumber: method === "BANK" ? accountNumber : null,

        cardNumber: method === "CARD" ? cardNumber : null, // only
        cardLast4: method === "CARD" ? cardLast4 : null,
      },
    });

    return user;
  });

  return NextResponse.json(updated);
}
