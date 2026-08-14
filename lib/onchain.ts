/**
 * Onchain signals from Alchemy (Base mainnet)
 */

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || "";
const BASE_RPC = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;

export interface OnchainSignal {
  transferCount24h: number;
  uniqueAddresses24h: number;
  activity: "accumulating" | "distributing" | "neutral" | "unknown";
  hint: string;
  source: "alchemy" | "fallback";
}

export async function getOnchainSignal(address: string): Promise<OnchainSignal> {
  if (!ALCHEMY_KEY) {
    return {
      transferCount24h: 0,
      uniqueAddresses24h: 0,
      activity: "unknown",
      hint: "No Alchemy key — onchain data unavailable",
      source: "fallback",
    };
  }

  try {
    const latestRes = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      }),
    });
    const latestData = await latestRes.json();
    const latest = parseInt(latestData.result, 16);
    const fromBlock = "0x" + Math.max(0, latest - 20000).toString(16);

    const transfersRes = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock,
            toBlock: "latest",
            contractAddresses: [address],
            category: ["erc20"],
            excludeZeroValue: true,
            maxCount: "0x64",
            withMetadata: false,
          },
        ],
      }),
    });

    const transfersData = await transfersRes.json();
    const transfers = transfersData?.result?.transfers || [];

    const unique = new Set<string>();
    for (const t of transfers) {
      if (t.from) unique.add(t.from.toLowerCase());
      if (t.to) unique.add(t.to.toLowerCase());
    }

    const count = transfers.length;
    let activity: OnchainSignal["activity"] = "neutral";
    if (count >= 40) activity = "accumulating";
    else if (count > 0) activity = "neutral";
    else activity = "unknown";

    return {
      transferCount24h: count,
      uniqueAddresses24h: unique.size,
      activity,
      hint: `${count} recent transfers, ${unique.size} unique addresses`,
      source: "alchemy",
    };
  } catch (e: any) {
    console.error("Onchain fetch failed:", e?.message || e);
    return {
      transferCount24h: 0,
      uniqueAddresses24h: 0,
      activity: "unknown",
      hint: "Onchain fetch failed",
      source: "fallback",
    };
  }
}
