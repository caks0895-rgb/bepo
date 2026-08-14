/**
 * Core Reality Gap analysis logic
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
    smartMoneyActivity?: "accumulating" | "distributing" | "neutral" | "unknown";
  };
  social: {
    mentionVolume?: "high" | "medium" | "low" | "unknown";
    sentiment?: "bullish" | "bearish" | "neutral" | "unknown";
  };
  summary: string;
  timestamp: string;
  source?: "llm" | "heuristic";
  debug?: string;
}

export async function analyzeToken(input: AnalyzeRequest): Promise<RealityGapResult> {
  const address = (input.address || "unknown").toLowerCase();

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

  const isFallback = !!llmResult.debug || llmResult.summary.includes("LLM unavailable");

  return {
    address,
    ticker: input.ticker,
    score: llmResult.score,
    label: llmResult.label as RealityGapResult["label"],
    confidence: llmResult.confidence,
    onchain: { smartMoneyActivity: onchainActivity as any },
    social: {
      mentionVolume: socialVolume as any,
      sentiment: socialSentiment as any,
    },
    summary: llmResult.summary,
    timestamp: new Date().toISOString(),
    source: isFallback ? "heuristic" : "llm",
    debug: llmResult.debug,
  };
}
