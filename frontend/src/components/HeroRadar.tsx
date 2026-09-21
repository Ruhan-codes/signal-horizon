export default function HeroRadar() {
  return (
    <section id="overview" className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center px-4">
      <div className="absolute inset-0 bg-obsidian z-0" />

      {/* Blurred Atmosphere Shape - Enhanced Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-gradient-to-r from-burgundy-900/60 via-purple-900/40 to-indigo-900/50 rounded-full blur-[120px] opacity-90 mix-blend-screen z-10" />

      <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center gap-6 mt-20">
        <span className="text-xs font-semibold tracking-[0.25em] text-indigo-400">
          OFFICIAL MOSPI & ESAKSHI TELEMETRY PIPELINE
        </span>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          National MPLADS Telemetry & Anomaly Radar
        </h1>

        <p className="text-lg text-white max-w-2xl">
          Monitoring ₹11,670+ Cr in parliamentary funds, 127,000+ public works, and data-derived risk screening across 543 Lok Sabha and 231+ Rajya Sabha parliamentarians.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a href="#visual-hub" className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all hover:ring-4 ring-emerald-900/60 shadow-xl shadow-emerald-950 flex items-center gap-2">
            <span>Explore Visual Charts</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">FLOW / BAR / HISTO / PIE</span>
          </a>
          <a href="#screener" className="px-8 py-3 rounded-full bg-burgundy-700 hover:bg-burgundy-500 text-white font-bold transition-all hover:ring-4 ring-burgundy-900">
            Audit Screener
          </a>
        </div>
      </div>
    </section>
  );
}
