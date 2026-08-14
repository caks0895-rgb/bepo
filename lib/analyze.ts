/**
 * Core Reality Gap analysis logic
 * Uses Gemini for scoring when available
 */

import { scoreRealityGap } from "./llm";

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
    volume24h?: number;
    holderChange24h?: number;
    smartMoneyActivity?: "accumulating" | "distributing" | "neutral" | "unknown";
  };
  social: {
    mentionVolume?: "high" | "medium" | "low" | "unknown";
    sentiment?: "bullish" | "bearish" | "neutral" | "unknown";
  };
  summary: string;
  timestamp: string;
  source?: "llm" | "heuristic";
}

export async function analyzeToken(input: AnalyzeRequest): Promise<RealityGapResult> {
  const address = (input.address || "unknown").toLowerCase();

  // === Placeholder signals (will be replaced by real Alchemy + social data) ===
  const hash = address.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const rawScore = 35 + (hash % 50);

  const onchainActivity = rawScore > 60 ? "accumulating" : "neutral";
  const socialVolume = rawScore > 65 ? "high" : "medium";
  const socialSentiment = rawScore > 55 ? "bullish" : "neutral";

  const llmResult = await scoreRealityGap({
    address,
    ticker: input.ticker,
    onchainHint: `Smart money activity appears ${onchainActivity}`,
    socialHint: `Mention volume ${socialVolume}, sentiment ${socialSentiment}`,
    rawScore,
  });

  // Detect if it was real LLM or fallback
  const isFallback = llmResult.summary.includes("LLM unavailable");

  return {
    address,
    ticker: input.ticker,
    score: llmResult.score,
    label: llmResult.label as RealityGapResult["label"],
    confidence: llmResult.confidence,
    onchain: {
      smartMoneyActivity: onchainActivity as any,
    },
    social: {
      mentionVolume: socialVolume as any,
      sentiment: socialSentiment as any,
    },
    summary: llmResult.summary,
    timestamp: new Date().toISOString(),
    source: isFallback ? "heuristic" : "llm",
  };
}
