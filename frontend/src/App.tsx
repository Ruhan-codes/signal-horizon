
import IntroTelemetry from './components/IntroTelemetry';
import SiteChrome from './components/SiteChrome';
import HeroRadar from './components/HeroRadar';
import BentoGrid from './components/BentoGrid';
import VisualAnalyticsHub from './components/VisualAnalyticsHub';
import TerminalScreener from './components/TerminalScreener';

import { useState, useEffect } from 'react';
import { api } from './lib/signal-api';
import type { DashboardSummary, MPAllocation, CalamityConsent } from './lib/signal-types';

export default function App() {
  const [house, setHouse] = useState<'ALL' | 'LS' | 'RS'>('ALL');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [allocations, setAllocations] = useState<MPAllocation[]>([]);
  const [calamities, setCalamities] = useState<CalamityConsent[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Synchronize initial real eSAKSHI data load across core datasets
    Promise.all([
      api.getSummary(house),
      api.getAllocations(house),
      api.getCalamities(house),
    ])
      .then(([s, a, c]) => {
        if (!s && a.length === 0) {
          setLoadError("eSAKSHI Dataset Backend is unreachable. Please verify FastAPI backend on port 8000.");
        } else {
          setSummary(s);
          setAllocations(a);
          setCalamities(c);
        }
        setIsDataLoaded(true);
      })
      .catch((err) => {
        setLoadError(`Failed to load dataset: ${err.message}`);
        setIsDataLoaded(true);
      });
  }, [house]);

  return (
    <div className="min-h-screen bg-obsidian text-white selection:bg-burgundy-500 selection:text-white font-sans antialiased">
      {/* Real Data Synchronized Telemetry Screen Overlay */}
      <IntroTelemetry isLoaded={isDataLoaded} />

      {/* Global Ambient Lighting */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[150px] mix-blend-screen opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-burgundy-900/20 rounded-full blur-[150px] mix-blend-screen opacity-70" />
      </div>

      {/* Floating Island Navigation */}
      <SiteChrome />

      {/* Hero Section */}
      <HeroRadar />

      {loadError && (
        <div className="max-w-4xl mx-auto px-4 my-6">
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between">
            <span>{loadError}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-medium text-xs ml-4"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Core Dashboard Modules */}
      <main className="relative z-10 space-y-12 pb-24">
        {/* Visual Analytics Hub: Flowchart, Bar Chart, Histogram, Pie Chart */}
        <VisualAnalyticsHub
          summary={summary}
          allocations={allocations}
          calamities={calamities}
          house={house}
          onHouseChange={setHouse}
        />

        {/* Bento Grid (Funnel, Sectors, Calamity, News) */}
        <BentoGrid house={house} onHouseChange={setHouse} />

        {/* Bloomberg-style Terminal Screener & Audit Table */}
        <TerminalScreener house={house} onHouseChange={setHouse} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-white bg-obsidian">
        <p>SIGNAL HORIZON // NATIONAL MPLADS GOVERNANCE & TELEMETRY RADAR</p>
        <p className="mt-1">Powered by FastAPI, Scikit-Learn ML Engines, and eSAKSHI Datasets</p>
      </footer>
    </div>
  );
}
