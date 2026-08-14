export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            BEPO
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Reality Gap Signal API for Base tokens.
            <br />
            <span className="text-sky-400">Onchain vs Social Hype</span> — powered by x402.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 mb-12 backdrop-blur">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-4 text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">1</span>
              <div>
                <strong className="text-white">Send a token</strong>
                <p className="text-sm">POST contract address or ticker to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">/api/analyze</code></p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">2</span>
              <div>
                <strong className="text-white">Pay via x402</strong>
                <p className="text-sm">Agent pays <strong className="text-sky-300">$0.025 USDC</strong> on Base automatically</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">3</span>
              <div>
                <strong className="text-white">Get Reality Gap score</strong>
                <p className="text-sm">Score 0-100 + explanation of onchain activity vs social hype</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 mb-12">
          <h3 className="text-lg font-medium mb-3 text-slate-200">Example Request</h3>
          <pre className="bg-slate-950 rounded-xl p-4 text-sm overflow-x-auto text-sky-300">
{`POST /api/analyze
Content-Type: application/json

{
  "address": "0x..."
}`}
          </pre>
        </div>

        <div className="text-center text-slate-400 text-sm">
          <p>MVP in progress · Built for AI agents on Base</p>
          <p className="mt-2">
            GitHub:{" "}
            <a
              href="https://github.com/caks0895-rgb/bepo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              caks0895-rgb/bepo
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
