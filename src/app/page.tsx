import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Autonomous Lead Intelligence
          </h1>
          <p className="text-xl text-blue-200 mb-12">
            AI-powered customer pain intelligence for fintech companies
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/analyze"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-xl mb-1">Analyze Company</div>
              <div className="text-sm text-blue-200">
                Generate intelligence brief for a fintech company
              </div>
            </Link>
            
            <Link
              href="/accounts"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-xl mb-1">Prioritized Accounts</div>
              <div className="text-sm text-purple-200">
                View all analyzed companies ranked by score
              </div>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-left">
            <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
            <div className="space-y-3 text-blue-100">
              <div className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">1.</span>
                <span>Enter a company domain or name</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">2.</span>
                <span>AI analyzes public signals: funding, hiring, customer feedback</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">3.</span>
                <span>Detects dominant customer pain themes with severity scores</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">4.</span>
                <span>Maps pain points to Alfabolt delivery capabilities</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">5.</span>
                <span>Generates "why now" assessment and personalized outreach message</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm text-blue-300">
            <p>Demo Mode: Works with seed data even without API keys</p>
            <p className="mt-2">
              Try these examples: PayFlow, LendTech Solutions, WealthHub, CryptoGate, BizBank
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
