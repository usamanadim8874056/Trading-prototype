/*
  Warnings:

  - You are about to drop the column `pnlInr` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `stakeInr` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `inrCash` on the `User` table. All the data in the column will be lost.
  - Added the required column `stakeUsd` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Symbol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last" INTEGER NOT NULL
);
INSERT INTO "new_Symbol" ("id", "last", "name", "ticker") SELECT "id", "last", "name", "ticker" FROM "Symbol";
DROP TABLE "Symbol";
ALTER TABLE "new_Symbol" RENAME TO "Symbol";
CREATE UNIQUE INDEX "Symbol_ticker_key" ON "Symbol"("ticker");
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "stakeUsd" INTEGER NOT NULL,
    "startPrice" INTEGER NOT NULL,
    "endPrice" INTEGER,
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "pnlUsd" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("direction", "endAt", "endPrice", "id", "startAt", "startPrice", "status", "symbolId", "userId") SELECT "direction", "endAt", "endPrice", "id", "startAt", "startPrice", "status", "symbolId", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "usdCash" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password") SELECT "createdAt", "email", "id", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
