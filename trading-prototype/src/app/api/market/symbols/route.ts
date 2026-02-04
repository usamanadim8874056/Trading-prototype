import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const list = await prisma.symbol.findMany({
    orderBy: { ticker: "asc" },
    select: { ticker: true, name: true, last: true },
  });

  return NextResponse.json(list);
}
