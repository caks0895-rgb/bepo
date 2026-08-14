import { NextRequest, NextResponse } from "next/server";
import { analyzeToken } from "@/lib/analyze";

/**
 * BEPO Reality Gap Analysis Endpoint
 * 
 * Protected by x402 in production.
 * For now this is a working skeleton that returns structured data.
 * 
 * Price target: $0.025 USDC on Base
 */

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

    // Run analysis
    const result = await analyzeToken({
      address: address || undefined,
      ticker: ticker || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        version: "0.1.0",
        priced: false, // will be true once x402 is fully wired
        note: "MVP skeleton — real onchain + social data coming next",
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

// Also support GET for simple testing
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
    });
  }

  // Reuse POST logic
  const result = await analyzeToken({
    address: address || undefined,
    ticker: ticker || undefined,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}
