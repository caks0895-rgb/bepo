/**
 * Core Reality Gap analysis logic
 * Now with AgentRouter + Claude Opus 5 scoring
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

  // Try LLM refinement with Claude Opus 5 via AgentRouter
  let final: {
    score: number;
    label: RealityGapResult["label"];
    summary: string;
    confidence: number;
    source: "llm" | "heuristic";
  } = {
    score: rawScore,
    label: "Medium Gap",
    summary: "Heuristic analysis only.",
    confidence: 0.55,
    source: "heuristic",
  };

  try {
    const llmResult = await scoreRealityGap({
      address,
      ticker: input.ticker,
      onchainHint: `Smart money activity appears ${onchainActivity}`,
      socialHint: `Mention volume ${socialVolume}, sentiment ${socialSentiment}`,
      rawScore,
    });

    final = {
      score: llmResult.score,
      label: llmResult.label as RealityGapResult["label"],
      summary: llmResult.summary,
      confidence: llmResult.confidence,
      source: "llm",
    };
  } catch (e) {
    console.warn("LLM scoring skipped:", e);
  }

  return {
    address,
    ticker: input.ticker,
    score: final.score,
    label: final.label,
    confidence: final.confidence,
    onchain: {
      smartMoneyActivity: onchainActivity as any,
    },
    social: {
      mentionVolume: socialVolume as any,
      sentiment: socialSentiment as any,
    },
    summary: final.summary,
    timestamp: new Date().toISOString(),
    source: final.source,
  };
}
