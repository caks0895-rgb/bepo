/**
 * Gemini LLM client for BEPO Reality Gap scoring
 */

const GEMINI_API_KEY =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function callGemini(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("No Gemini API key found (GOOGLE_AI_API_KEY / GEMINI_API_KEY)");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 400,
      temperature: options.temperature ?? 0.2,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${JSON.stringify(data)}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(`No text in Gemini response: ${JSON.stringify(data)}`);
  }

  return text;
}

/**
 * Generate Reality Gap summary + refined score using Gemini
 */
export async function scoreRealityGap(params: {
  address: string;
  ticker?: string;
  onchainHint: string;
  socialHint: string;
  rawScore: number;
}): Promise<{ score: number; label: string; summary: string; confidence: number }> {
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

Respond ONLY with this exact JSON (no markdown, no extra text):
{"score": number, "label": "High Gap"|"Medium Gap"|"Low Gap"|"Aligned", "summary": "string", "confidence": number}`;

  try {
    const raw = await callGemini(prompt, { maxTokens: 300, temperature: 0.2 });

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in response: " + raw.slice(0, 200));

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
    };
  }
}
