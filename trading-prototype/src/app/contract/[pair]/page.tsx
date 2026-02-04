import ContractClient from "./ContractClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string }>;
}) {
  const sp = await searchParams;
  const ticker = sp?.ticker || "BTC/USD";

  return <ContractClient ticker={ticker} />;
}
