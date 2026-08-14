/**
 * Gemini LLM client for BEPO Reality Gap scoring
 */

const GEMINI_API_KEY =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.5-flash",
].filter(Boolean) as string[];

export async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("No Gemini API key found");
  }

  let lastError = "";

  for (const model of MODEL_CANDIDATES) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.2,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        lastError = `${model} → ${res.status}: ${data?.error?.message || "unknown"}`;
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;

      lastError = `${model} → empty response`;
    } catch (e: any) {
      lastError = `${model} → ${e.message}`;
    }
  }

  throw new Error(lastError || "All Gemini models failed");
}

export async function scoreRealityGap(params: {
  address: string;
  ticker?: string;
  onchainHint: string;
  socialHint: string;
  rawScore: number;
}): Promise<{ score: number; label: string; summary: string; confidence: number; debug?: string }> {
  const prompt = `You are an expert crypto analyst for Reality Gap (onchain vs social hype).

Token: ${params.ticker || "Unknown"} (${params.address})
Onchain: ${params.onchainHint}
Social: ${params.socialHint}
Initial score: ${params.rawScore}/100

Return ONLY valid complete JSON (no markdown, no extra text):
{"score":<0-100>,"label":"High Gap"|"Medium Gap"|"Low Gap"|"Aligned","summary":"<1-2 short sentences>","confidence":<0.0-1.0>}

Rules: Higher score = bigger gap. Keep summary under 160 chars. JSON must be complete.`;

  try {
    const raw = await callGemini(prompt);

    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON: " + raw.slice(0, 150));

    const parsed = JSON.parse(match[0]);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || params.rawScore)),
      label: ["High Gap", "Medium Gap", "Low Gap", "Aligned"].includes(parsed.label)
        ? parsed.label
        : "Medium Gap",
      summary: String(parsed.summary || "Analysis completed.").slice(0, 280),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
    };
  } catch (err: any) {
    console.error("LLM scoring failed:", err?.message || err);
    let label = "Medium Gap";
    if (params.rawScore >= 70) label = "High Gap";
    else if (params.rawScore >= 55) label = "Medium Gap";
    else if (params.rawScore >= 40) label = "Low Gap";
    else label = "Aligned";

    return {
      score: params.rawScore,
      label,
      summary: "LLM unavailable — using heuristic score.",
      confidence: 0.5,
      debug: err?.message || String(err),
    };
  }
}
