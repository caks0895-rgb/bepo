/**
 * Social signals from Sorsa (X/Twitter data)
 */

const SORSA_KEY = process.env.SORSA_API_KEY || "";
const SORSA_BASE = "https://api.sorsa.io/v3";

export interface SocialSignal {
  mentionCount: number;
  volume: "high" | "medium" | "low" | "unknown";
  sentiment: "bullish" | "bearish" | "neutral" | "unknown";
  hint: string;
  source: "sorsa" | "fallback";
}

export async function getSocialSignal(params: {
  ticker?: string;
  address?: string;
}): Promise<SocialSignal> {
  if (!SORSA_KEY) {
    return {
      mentionCount: 0,
      volume: "unknown",
      sentiment: "unknown",
      hint: "No Sorsa key — social data unavailable",
      source: "fallback",
    };
  }

  let query = "";
  if (params.ticker) {
    const t = params.ticker.replace(/^\$/, "").toUpperCase();
    query = `$${t} OR ${t}`;
  } else if (params.address) {
    query = params.address.slice(0, 10);
  } else {
    return {
      mentionCount: 0,
      volume: "unknown",
      sentiment: "unknown",
      hint: "No ticker or address for social search",
      source: "fallback",
    };
  }

  try {
    const res = await fetch(`${SORSA_BASE}/search-tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApiKey: SORSA_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sorsa ${res.status}: ${errText.slice(0, 120)}`);
    }

    const data = await res.json();
    const tweets = data?.tweets || data?.data || [];
    const count = Array.isArray(tweets) ? tweets.length : 0;

    let volume: SocialSignal["volume"] = "low";
    if (count >= 25) volume = "high";
    else if (count >= 8) volume = "medium";
    else if (count > 0) volume = "low";
    else volume = "unknown";

    let bull = 0;
    let bear = 0;
    for (const tw of tweets.slice(0, 30)) {
      const text = (tw.full_text || tw.text || "").toLowerCase();
      if (/moon|pump|bull|buy|long|breakout|ath|rocket/.test(text)) bull++;
      if (/dump|bear|sell|short|rug|scam|crash/.test(text)) bear++;
    }

    let sentiment: SocialSignal["sentiment"] = "neutral";
    if (bull > bear + 2) sentiment = "bullish";
    else if (bear > bull + 2) sentiment = "bearish";

    return {
      mentionCount: count,
      volume,
      sentiment,
      hint: `${count} recent mentions, volume=${volume}, sentiment=${sentiment}`,
      source: "sorsa",
    };
  } catch (e: any) {
    console.error("Social fetch failed:", e?.message || e);
    return {
      mentionCount: 0,
      volume: "unknown",
      sentiment: "unknown",
      hint: "Social fetch failed",
      source: "fallback",
    };
  }
}
