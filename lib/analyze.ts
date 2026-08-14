/**
 * Reality Gap analysis — real onchain + social + Gemini scoring
 */

import { scoreRealityGap } from "./llm";
import { getOnchainSignal } from "./onchain";
import { getSocialSignal } from "./social";

export interface AnalyzeRequest {
  address?: string;
  ticker?: string;
}

export interface RealityGapResult {
  address: string;
  ticker?: string;
  score: number;
  label: "High Gap" | "Medium Gap" | "Low Gap" | "Aligned";
  confidence: number;
  onchain: {
    transferCount24h?: number;
    uniqueAddresses24h?: number;
    smartMoneyActivity?: "accumulating" | "distributing" | "neutral" | "unknown";
  };
  social: {
    mentionCount?: number;
    mentionVolume?: "high" | "medium" | "low" | "unknown";
    sentiment?: "bullish" | "bearish" | "neutral" | "unknown";
  };
  summary: string;
  timestamp: string;
  source?: "llm" | "heuristic";
  debug?: string;
  dataSource?: {
    onchain: string;
    social: string;
  };
}

function heuristicScore(
  onchainActivity: string,
  socialVolume: string,
  socialSentiment: string
): number {
  let score = 45;

  if (onchainActivity === "accumulating" && socialVolume === "low") score += 30;
  else if (onchainActivity === "accumulating" && socialVolume === "medium") score += 18;
  else if (onchainActivity === "accumulating" && socialVolume === "high") score += 5;

  if (socialVolume === "high" && onchainActivity === "unknown") score += 10;
  if (socialVolume === "high" && onchainActivity === "neutral") score += 8;

  if (socialSentiment === "bullish") score += 5;
  if (socialSentiment === "bearish") score -= 5;

  return Math.min(95, Math.max(15, score));
}

export async function analyzeToken(input: AnalyzeRequest): Promise<RealityGapResult> {
  const address = (input.address || "unknown").toLowerCase();
  const ticker = input.ticker;

  const [onchain, social] = await Promise.all([
    address !== "unknown"
      ? getOnchainSignal(address)
      : Promise.resolve({
          transferCount24h: 0,
          uniqueAddresses24h: 0,
          activity: "unknown" as const,
          hint: "No address provided",
          source: "fallback" as const,
        }),
    getSocialSignal({
      ticker,
      address: address !== "unknown" ? address : undefined,
    }),
  ]);

  const rawScore = heuristicScore(onchain.activity, social.volume, social.sentiment);

  const llmResult = await scoreRealityGap({
    address,
    ticker,
    onchainHint: onchain.hint,
    socialHint: social.hint,
    rawScore,
  });

  const isFallback =
    !!llmResult.debug || llmResult.summary.includes("LLM unavailable");

  return {
    address,
    ticker,
    score: llmResult.score,
    label: llmResult.label as RealityGapResult["label"],
    confidence: llmResult.confidence,
    onchain: {
      transferCount24h: onchain.transferCount24h,
      uniqueAddresses24h: onchain.uniqueAddresses24h,
      smartMoneyActivity: onchain.activity,
    },
    social: {
      mentionCount: social.mentionCount,
      mentionVolume: social.volume,
      sentiment: social.sentiment,
    },
    summary: llmResult.summary,
    timestamp: new Date().toISOString(),
    source: isFallback ? "heuristic" : "llm",
    debug: llmResult.debug,
    dataSource: {
      onchain: onchain.source,
      social: social.source,
    },
  };
}
