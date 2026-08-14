/**
 * Gemini LLM client for BEPO Reality Gap scoring
 */

const GEMINI_API_KEY =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

// Try multiple model names in order
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash-001",
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
          maxOutputTokens: 400,
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
        lastError = `Model ${model} → ${res.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 150)}`;
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;

      lastError = `Model ${model} → no text in response`;
    } catch (e: any) {
      lastError = `Model ${model} → ${e.message}`;
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
  const prompt = `You are an expert crypto analyst specializing in Reality Gap analysis (onchain activity vs social hype).

Token: ${params.ticker || "Unknown"} (${params.address})
Raw onchain signal: ${params.onchainHint}
Raw social signal: ${params.socialHint}
Initial numeric score: ${params.rawScore}/100

Task:
1. Refine the Reality Gap score (0-100). Higher = bigger gap between onchain strength and social attention.
2. Choose one label: "High Gap" | "Medium Gap" | "Low Gap" | "Aligned"
3. Write a short, sharp 1-2 sentence summary in English.
4. Give confidence 0.0-1.0

Respond ONLY with this exact JSON (no markdown):
{"score": number, "label": "High Gap"|"Medium Gap"|"Low Gap"|"Aligned", "summary": "string", "confidence": number}`;

  try {
    const raw = await callGemini(prompt);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON: " + raw.slice(0, 120));

    const parsed = JSON.parse(match[0]);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || params.rawScore)),
      label: ["High Gap", "Medium Gap", "Low Gap", "Aligned"].includes(parsed.label)
        ? parsed.label
        : "Medium Gap",
      summary: String(parsed.summary || "Analysis completed."),
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
