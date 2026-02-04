import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = body?.email?.trim();
  const password = body?.password;
  const wantAdmin = Boolean(body?.wantAdmin);
  const adminCode = String(body?.adminCode || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  // ✅ Decide role safely
  let role: "USER" | "ADMIN" = "USER";

  if (wantAdmin) {
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { error: "ADMIN_KEY is not set on server" },
        { status: 500 }
      );
    }

    if (adminCode !== ADMIN_KEY) {
      return NextResponse.json(
        { error: "Invalid Admin Code" },
        { status: 403 }
      );
    }

    role = "ADMIN";
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      role,
    },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
