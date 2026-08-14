/**
 * AgentRouter LLM client for BEPO
 * Uses Claude Opus 5 via Anthropic-compatible endpoint
 */

const AGENTROUTER_BASE = process.env.AGENTROUTER_BASE_URL || "https://agentrouter.org";
const AGENTROUTER_KEY = process.env.AGENTROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.AGENTROUTER_MODEL || "claude-opus-5";

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function callAgentRouter(
  messages: LLMMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!AGENTROUTER_KEY) {
    throw new Error("AGENTROUTER_API_KEY is not set");
  }

  const body = {
    model: MODEL,
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.3,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  // Anthropic Messages style
  const res = await fetch(`${AGENTROUTER_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AGENTROUTER_KEY,
      Authorization: `Bearer ${AGENTROUTER_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AgentRouter error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Handle both Anthropic and OpenAI-style responses
  if (data.content && Array.isArray(data.content)) {
    return data.content.map((c: any) => c.text || "").join("");
  }
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (typeof data === "string") return data;

  throw new Error("Unexpected response format from AgentRouter");
}

/**
 * Generate Reality Gap summary + refined score using Claude Opus 5
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

Respond ONLY in this exact JSON format, no markdown:
{"score": number, "label": "High Gap"|"Medium Gap"|"Low Gap"|"Aligned", "summary": "string", "confidence": number}`;

  try {
    const raw = await callAgentRouter([
      { role: "user", content: prompt },
    ], { maxTokens: 300, temperature: 0.2 });

    // Extract JSON
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    const parsed = JSON.parse(match[0]);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || params.rawScore)),
      label: ["High Gap", "Medium Gap", "Low Gap", "Aligned"].includes(parsed.label)
        ? parsed.label
        : "Medium Gap",
      summary: String(parsed.summary || "Analysis completed."),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
    };
  } catch (err) {
    console.error("LLM scoring failed, falling back:", err);
    // Fallback to raw
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
