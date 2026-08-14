# BEPO

**Reality Gap Signal API** for Base tokens.  
Powered by **x402** — agents pay $0.025 USDC per analysis.

## What is Reality Gap?

The difference between **onchain activity** (real money movement, smart money, holders) and **social hype** (mentions, sentiment on X).

High Reality Gap = onchain is stronger / quieter than the social narrative (potential stealth accumulation or ignored strength).

## Quick Start

```bash
git clone https://github.com/caks0895-rgb/bepo.git
cd bepo
pnpm install   # or npm install
cp .env.example .env.local
# fill the keys
pnpm dev
```

## API

### `POST /api/analyze`

```json
{
  "address": "0x..."
}
```

or

```json
{
  "ticker": "TOKEN"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "score": 72,
    "label": "High Gap",
    "confidence": 0.65,
    "onchain": {
      "smartMoneyActivity": "accumulating"
    },
    "social": {
      "mentionVolume": "high",
      "sentiment": "bullish"
    },
    "summary": "Significant reality gap detected...",
    "timestamp": "2026-08-14T..."
  }
}
```

### Pricing (x402)

- **$0.025 USDC** per successful analysis
- Network: Base
- Protocol: x402

## Status

- [x] Project scaffold
- [x] Basic analyze endpoint
- [x] Landing page
- [x] Linked to Vercel
- [ ] Real onchain data (Alchemy)
- [ ] Real social data (Sorsa / alternative)
- [ ] Full x402 middleware protection
- [ ] LLM scoring layer

## Stack

- Next.js 15
- TypeScript
- x402 + Coinbase CDP Facilitator
- Tailwind CSS

## License

MIT
