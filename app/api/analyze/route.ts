import { NextRequest, NextResponse } from "next/server";
import { analyzeToken } from "@/lib/analyze";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const address = body.address || body.contract || body.token;
    const ticker = body.ticker || body.symbol;

    if (!address && !ticker) {
      return NextResponse.json(
        { error: "Missing required field: address or ticker" },
        { status: 400 }
      );
    }

    const result = await analyzeToken({
      address: address || undefined,
      ticker: ticker || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        version: "0.1.0",
        priced: false,
        note: "MVP skeleton — real onchain + social data coming next",
        hasGeminiKey: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      },
    });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Internal analysis error", message: error?.message || "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || searchParams.get("contract");
  const ticker = searchParams.get("ticker") || searchParams.get("symbol");

  if (!address && !ticker) {
    return NextResponse.json({
      name: "BEPO Reality Gap API",
      version: "0.1.0",
      endpoints: {
        "POST /api/analyze": "Analyze a token (send { address } or { ticker })",
      },
      pricing: {
        amount: "0.025",
        currency: "USDC",
        network: "Base",
        protocol: "x402",
      },
      status: "MVP skeleton live",
      hasGeminiKey: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    });
  }

  const result = await analyzeToken({
    address: address || undefined,
    ticker: ticker || undefined,
  });

  return NextResponse.json({
    success: true,
    data: result,
    meta: {
      hasGeminiKey: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    },
  });
}
