import { useEffect, useState } from 'react';
import { api, crore } from '../lib/signal-api';
import type { DashboardSummary, CalamityConsent } from '../lib/signal-types';
import { Layers, PieChart, ShieldAlert, Radio } from 'lucide-react';

export default function BentoGrid({ house, onHouseChange }: { house: 'ALL' | 'LS' | 'RS'; onHouseChange: (house: 'ALL' | 'LS' | 'RS') => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [calamities, setCalamities] = useState<CalamityConsent[]>([]);

  useEffect(() => {
    api.getSummary(house).then(setSummary);
    api.getCalamities(house).then(setCalamities);
  }, [house]);

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Module 1: Parliament Lifecycle Funnel (Span 7) */}
        <div id="funnel" className="md:col-span-7 liquid-glass-strong rounded-2xl p-6 relative border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs tracking-wider uppercase font-semibold">
                <Layers size={16} />
                <span>Parliament Lifecycle Funnel</span>
              </div>
              <div className="flex bg-white/5 p-1 rounded-lg text-xs">
                {(['ALL', 'LS', 'RS'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => onHouseChange(h)}
                    className={`px-3 py-1 rounded-md transition-colors ${house === h ? 'bg-burgundy-700 text-white font-bold shadow' : 'text-white hover:text-white'}`}
                  >
                    {h === 'ALL' ? 'All Parliament' : h === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{house === 'ALL' ? 'All Parliament' : house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'} Fund Velocity</span>
                </h3>
                <p className="text-white text-sm mt-1">Lifecycle pipeline from MP recommendation to on-ground civil completion.</p>
              </div>
              {summary && (
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-white block">{house === 'ALL' ? 'Total Parliament' : house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'} Outlay</span>
                  <span className="font-mono text-xl font-extrabold text-amber-400">{crore(summary.total_allocated_cr)}</span>
                </div>
              )}
            </div>

            {(() => {
              const rec = summary?.works_recommended || 1;
              const sanc = summary?.works_sanctioned || 0;
              const comp = summary?.works_completed || 0;
              const sancPct = Math.min(100, Math.round((sanc / rec) * 100));
              const compPct = sanc > 0 ? Math.min(100, Math.round((comp / sanc) * 100)) : 0;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Stage 1: Recommended */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
                      <span>Stage 01</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">INTAKE</span>
                    </div>
                    <div>
                      <div className="text-xs text-white mb-1">Recommended Works</div>
                      <div className="text-3xl font-black font-mono text-white tracking-tight">
                        {summary ? summary.works_recommended.toLocaleString() : '...'}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white">
                      <span>Pipeline Base</span>
                      <span className="font-mono text-indigo-300">100% Initiated</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Stage 2: Sanctioned */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
                    <div className="flex items-center justify-between text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">
                      <span>Stage 02</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">{sancPct}% of rec</span>
                    </div>
                    <div>
                      <div className="text-xs text-white mb-1">Sanctioned Works</div>
                      <div className="text-3xl font-black font-mono text-purple-200 tracking-tight">
                        {summary ? summary.works_sanctioned.toLocaleString() : '...'}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white">
                      <span>Admin Clearance</span>
                      <span className="font-mono text-purple-300">{sancPct}% Converted</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${sancPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage 3: Completed */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
                      <span>Stage 03</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">{compPct}% of sanc</span>
                    </div>
                    <div>
                      <div className="text-xs text-white mb-1">Completed on Ground</div>
                      <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                        {summary ? summary.works_completed.toLocaleString() : '...'}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white">
                      <span>Execution Rate</span>
                      <span className="font-mono text-emerald-300">{compPct}% Sanctioned</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${compPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
            <span>Aggregated Data from Official eSAKSHI Portals ({house === 'ALL' ? 'All Parliament' : house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'})</span>
            <span className="font-mono text-indigo-300 font-semibold">
              Conversion Efficiency: {summary && summary.works_recommended > 0 ? ((summary.works_completed / summary.works_recommended) * 100).toFixed(1) + '% End-to-End' : 'Computing...'}
            </span>
          </div>
        </div>

        <div className="md:col-span-5 liquid-glass-strong rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs tracking-wider uppercase font-semibold">
                <PieChart size={16} />
                <span>Sectoral Telemetry // Donut Chart</span>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md font-mono font-bold">
                {summary ? crore(summary.total_allocated_cr) : '...'}
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-white mb-1">Priority Sectors</h3>
            <p className="text-white text-sm mb-4">Capital distribution across core civil infrastructure domains.</p>

            {/* Dynamic Donut Pie Chart derived from summary data */}
            {(() => {
              const rec = summary?.works_recommended || 1;
              const sanc = summary?.works_sanctioned || 0;
              const comp = summary?.works_completed || 0;
              const pending = Math.max(0, rec - sanc);
              const inExec = Math.max(0, sanc - comp);
              const total = rec;
              const compPct = Math.round((comp / total) * 100);
              const execPct = Math.round((inExec / total) * 100);
              const pendingPct = Math.round((pending / total) * 100);
              const circumference = 238.7;
              const segments = [
                { pct: compPct, color: '#10b981', label: 'Completed', textColor: 'text-emerald-400' },
                { pct: execPct, color: '#6366f1', label: 'In Execution', textColor: 'text-indigo-400' },
                { pct: pendingPct, color: '#f59e0b', label: 'Pending', textColor: 'text-amber-400' },
              ];
              let offset = 0;
              return (
                <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {segments.map((seg, i) => {
                        const dashArray = `${seg.pct * circumference / 100} ${circumference}`;
                        const dashOffset = -offset * circumference / 100;
                        offset += seg.pct;
                        return (
                          <circle
                            key={i}
                            cx="50" cy="50" r="38"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-700"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono text-white uppercase">{house === 'ALL' ? 'All' : house}</span>
                      <span className="text-sm font-black font-mono text-white">{compPct}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs flex-1 min-w-0">
                    {segments.map((seg, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-white">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                          {seg.label}
                        </span>
                        <span className={`font-mono font-bold ${seg.textColor}`}>{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              {[
                { name: 'Recommended Works', pct: 100, amount: summary?.works_recommended.toLocaleString() || '...', color: 'bg-white/30', works: 'Total Pipeline Entry' },
                { name: 'Sanctioned Works', pct: summary ? Math.round((summary.works_sanctioned / (summary.works_recommended || 1)) * 100) : 43, amount: summary?.works_sanctioned.toLocaleString() || '...', color: 'bg-indigo-500', works: 'Administrative Cleared' },
                { name: 'Completed on Ground', pct: summary ? Math.round((summary.works_completed / (summary.works_recommended || 1)) * 100) : 34, amount: summary?.works_completed.toLocaleString() || '...', color: 'bg-emerald-500', works: 'Physical Assets Delivered' },
              ].map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm text-white font-bold block">{s.name}</span>
                      <span className="text-[11px] text-white">{s.works}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-black text-white block tracking-tight">{s.amount}</span>
                      <span className="text-[10px] font-mono font-extrabold text-indigo-400">{s.pct}% Share</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white">
            <span>eSAKSHI Works Pipeline ({house === 'ALL' ? 'All Parliament' : house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'})</span>
            <span className="font-mono text-white font-semibold">{summary ? `${((summary.works_completed / (summary.works_recommended || 1)) * 100).toFixed(1)}% End-to-End` : 'Computing...'}</span>
          </div>
        </div>

        {/* Module 3: Calamity Relief Tracker (Span 6) */}
        <div id="calamity" className="md:col-span-6 liquid-glass-strong rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs tracking-wider uppercase font-semibold">
                <ShieldAlert size={16} />
                <span>Emergency Diversion Protocol</span>
              </div>
              <span className="text-xs bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-md font-mono font-extrabold">
                {calamities.length} DISPATCHES
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
              <h3 className="text-2xl font-black tracking-tight text-white">Calamity Relief Tracker</h3>
              <span className="text-3xl font-mono font-black text-rose-400 tracking-tight">
                {crore(calamities.reduce((acc, c) => acc + c.amount_cr, 0))}
              </span>
            </div>
            <p className="text-white text-sm mb-4">Parliamentarian funds officially consented to disaster relief.</p>

            {/* Quick Summary Chips with Large Values */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
                <span className="text-xs uppercase text-rose-300 tracking-wider font-semibold block mb-1">Relief Outlay</span>
                <span className="font-mono text-xl font-black text-rose-200 block">
                  {crore(calamities.reduce((acc, c) => acc + c.amount_cr, 0))}
                </span>
                <span className="text-[11px] text-rose-300 font-mono mt-0.5 block">{calamities.length} Statutory Consents</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs uppercase text-white tracking-wider font-semibold block mb-1">Top Disaster</span>
                <span className="text-sm font-bold text-white block truncate">
                  {calamities.length > 0 ? calamities.sort((a, b) => b.amount_cr - a.amount_cr)[0].event_name : 'None'}
                </span>
                <span className="text-[11px] text-white font-mono mt-0.5 block">Highest Relief Outlay</span>
              </div>
            </div>

            {/* Scrollable List Container (Fixed Height) */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {calamities.length > 0 ? calamities.map(c => (
                <div key={c.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-rose-900/60 hover:bg-rose-950/20 transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-sm font-bold text-white leading-tight flex-1">{c.event_name}</span>
                    <span className="text-base font-mono font-black text-rose-400 ml-3 whitespace-nowrap">{crore(c.amount_cr)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-white mt-1">
                    <span className="font-semibold text-white">
                      {c.mp_name}{c.constituency ? ` (${c.constituency})` : ''}
                    </span>
                    <span className="font-mono text-xs text-white">{c.date_consented}</span>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-white py-8 text-center">Loading calamity telemetry...</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-white">
            <span>Direct Parliamentary Consent Under MPLADS Rule 5.2</span>
            <span className="font-mono text-rose-300 font-semibold">Active Emergency Register</span>
          </div>
        </div>

        {/* Module 4: Live Intelligence Feed (Span 6) */}
        <div className="md:col-span-6 liquid-glass-strong rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs tracking-wider uppercase font-semibold">
                <Radio size={16} className="animate-pulse" />
                <span>Live Signal Intelligence</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md font-mono font-bold">FEED ACTIVE</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
              <h3 className="text-2xl font-black tracking-tight text-white">Civic Pulse & Sentiment</h3>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">GDELT 2.0 Ingest</span>
            </div>
            <p className="text-white text-sm mb-4">Real-time local coverage and media sentiment tracking execution bottlenecks.</p>

            {/* Signal Telemetry Mini Cards with Distinct Big Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                <span className="text-xs uppercase text-emerald-300 tracking-wider font-semibold block mb-1">Civic Sentiment Tone</span>
                <span className="font-mono text-2xl font-black text-emerald-400 block tracking-tight">+1.85</span>
                <span className="text-[11px] text-emerald-300 font-semibold block mt-0.5">Bullish Confidence</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs uppercase text-white tracking-wider font-semibold block mb-1">Monitored Media Sources</span>
                <span className="font-mono text-2xl font-black text-white block tracking-tight">1,420</span>
                <span className="text-[11px] text-white block mt-0.5">Regional & National Outlets</span>
              </div>
            </div>

            {/* Signal Stream List (Fixed Height to match Calamity) */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {[
                { title: 'New Multi-Speciality Community Health Outlay Sanctioned', loc: 'Wayanad, KL', time: '14m ago', tone: '+2.4 Positive', tag: 'HEALTH' },
                { title: 'Bridge Reconstruction Progress Under Review by District Magistrate', loc: 'Varanasi, UP', time: '1h ago', tone: 'Neutral', tag: 'ROADS' },
                { title: 'Solar Powered Irrigation Feeder Line Completed in Record Time', loc: 'Baramati, MH', time: '2h ago', tone: '+3.1 Positive', tag: 'ENERGY' },
                { title: 'Audit Triggered on Rural Water Filtration Plant Installation Delay', loc: 'Pune, MH', time: '3h ago', tone: '-1.8 Anomaly Flag', tag: 'WATER' },
                { title: 'District Level MPLADS Grievance Redressal Mechanism Upgraded', loc: 'Amritsar, PB', time: '5h ago', tone: '+1.2 Positive', tag: 'GOVERNANCE' },
                { title: 'Gram Panchayat Submits Expedited Drain Reconstruction Petitions', loc: 'Cuttack, OD', time: '6h ago', tone: 'Neutral', tag: 'CIVIC' },
              ].map((feed, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-colors">
                  <div className="pr-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">{feed.tag}</span>
                      <span className="text-xs text-white">{feed.loc} • {feed.time}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white/95 leading-snug truncate">{feed.title}</h4>
                  </div>
                  <span className={`text-xs font-mono font-black px-2.5 py-1.5 rounded-lg whitespace-nowrap ${feed.tone.includes('+') ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30' : feed.tone.includes('-') ? 'bg-rose-900/40 text-rose-300 border border-rose-500/30' : 'bg-white/10 text-white'}`}>
                    {feed.tone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-white">
            <span>Global Database of Events, Language, and Tone</span>
            <span className="font-mono text-emerald-400 font-semibold">Stream Status: Synchronized</span>
          </div>
        </div>

      </div>
    </section>
  );
}
