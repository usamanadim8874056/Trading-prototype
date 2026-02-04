import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const symbols = [
    { ticker: "BTC/USD", name: "Bitcoin / USD", last: 42000 },
    { ticker: "ETH/USD", name: "Ethereum / USD", last: 2200 },
    { ticker: "SOL/USD", name: "Solana / USD", last: 95 },
    { ticker: "DOGE/USD", name: "Dogecoin / USD", last: 0.18 },
  ];

  for (const s of symbols) {
    await prisma.symbol.upsert({
      where: { ticker: s.ticker },
      update: { name: s.name, last: s.last },
      create: s,
    });
  }
}

main().finally(() => prisma.$disconnect());
