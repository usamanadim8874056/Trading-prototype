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

  const method = String(body?.method || "BANK");
  const amount = Number(body?.amount ?? 0);

  const bankName = String(body?.bankName || "");
  const accountName = String(body?.accountName || "");
  const accountNumber = String(body?.accountNumber || "");
  const cardNumber = String(body?.cardNumber || "");

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const cardLast4 = cardNumber ? cardNumber.replace(/\s/g, "").slice(-4) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: payload.userId },
      select: { usdCash: true },
    });

    if (!user) throw new Error("Unauthorized");
    if (user.usdCash < amount) throw new Error("Insufficient balance");

    // Deduct money
    const user2 = await tx.user.update({
      where: { id: payload.userId },
      data: { usdCash: { decrement: amount } },
      select: { usdCash: true },
    });

    // ✅ store wallet tx + details
    await tx.walletTx.create({
      data: {
        userId: payload.userId,
        type: "WITHDRAW",
        amountUsd: amount,
        status: "SUCCESS",
        note: "Withdraw",

        method,
        bankName: method === "BANK" ? bankName : null,
        accountName: method === "BANK" ? accountName : null,
        accountNumber: method === "BANK" ? accountNumber : null,

        cardNumber: method === "CARD" ? cardNumber : null, // only
        cardLast4: method === "CARD" ? cardLast4 : null,
      },
    });

    return user2;
  }).catch((e) => {
    const msg = String(e?.message || e);
    if (msg.includes("Insufficient")) return null;
    throw e;
  });

  if (!updated) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  return NextResponse.json(updated);
}
