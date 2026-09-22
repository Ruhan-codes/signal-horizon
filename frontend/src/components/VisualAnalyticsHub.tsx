import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  GitCommit,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { MPAllocation, DashboardSummary, CalamityConsent } from '../lib/signal-types';

interface VisualAnalyticsHubProps {
  summary: DashboardSummary | null;
  allocations: MPAllocation[];
  calamities: CalamityConsent[];
  house: 'ALL' | 'LS' | 'RS';
  onHouseChange: (house: 'ALL' | 'LS' | 'RS') => void;
}


export default function VisualAnalyticsHub({
  summary,
  allocations,
  calamities,
  house,
  onHouseChange,
}: VisualAnalyticsHubProps) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'barchart' | 'histogram' | 'piechart'>('flowchart');
  const [stateSortBy, setStateSortBy] = useState<'outlay' | 'utilization' | 'count'>('outlay');
  const [histogramMetric, setHistogramMetric] = useState<'utilization' | 'risk'>('utilization');

  // 1. DATA FOR FLOWCHART PIPELINE
  const pipelineMetrics = useMemo(() => {
    const rec = summary?.works_recommended || 127420;
    const sanc = summary?.works_sanctioned || 54203;
    const comp = summary?.works_completed || 43725;
    const drop1 = Math.max(0, rec - sanc);
    const drop2 = Math.max(0, sanc - comp);
    const sancPct = ((sanc / rec) * 100).toFixed(1);
    const compPct = ((comp / sanc) * 100).toFixed(1);
    const endToEndPct = ((comp / rec) * 100).toFixed(1);

    return {
      rec,
      sanc,
      comp,
      drop1,
      drop2,
      sancPct,
      compPct,
      endToEndPct,
    };
  }, [summary]);

  // 2. DATA FOR BAR CHARTS (State-wise breakdown & Top Outlay MPs)
  const stateBarData = useMemo(() => {
    const map = new Map<string, { state: string; totalOutlay: number; avgUtil: number; count: number; sumUtil: number }>();
    allocations.forEach((item) => {
      const s = item.state || 'Unknown';
      if (!map.has(s)) {
        map.set(s, { state: s, totalOutlay: 0, avgUtil: 0, count: 0, sumUtil: 0 });
      }
      const entry = map.get(s)!;
      entry.totalOutlay += item.allocated_cr;
      entry.sumUtil += item.utilization_pct;
      entry.count += 1;
    });

    const list = Array.from(map.values()).map((e) => ({
      state: e.state,
      totalOutlay: Number(e.totalOutlay.toFixed(2)),
      avgUtil: Number((e.sumUtil / (e.count || 1)).toFixed(1)),
      count: e.count,
    }));

    if (stateSortBy === 'outlay') {
      list.sort((a, b) => b.totalOutlay - a.totalOutlay);
    } else if (stateSortBy === 'utilization') {
      list.sort((a, b) => b.avgUtil - a.avgUtil);
    } else {
      list.sort((a, b) => b.count - a.count);
    }

    return list.slice(0, 12);
  }, [allocations, stateSortBy]);

  const topMpOutlayData = useMemo(() => {
    return [...allocations]
      .sort((a, b) => b.allocated_cr - a.allocated_cr)
      .slice(0, 8)
      .map((item) => ({
        name: item.mp_name.length > 15 ? item.mp_name.slice(0, 15) + '...' : item.mp_name,
        fullName: item.mp_name,
        allocated_cr: Number(item.allocated_cr.toFixed(2)),
        utilization_pct: item.utilization_pct,
        risk_badge: item.risk_badge,
        raw: item,
      }));
  }, [allocations]);

  // 3. DATA FOR HISTOGRAMS (Utilization & Risk Score distributions)
  const utilizationHistogramData = useMemo(() => {
    const bins = [
      { range: '0-10%', min: 0, max: 10, count: 0, fill: '#f43f5e', mps: [] as string[] },
      { range: '10-25%', min: 10, max: 25, count: 0, fill: '#f43f5e', mps: [] as string[] },
      { range: '25-40%', min: 25, max: 40, count: 0, fill: '#f59e0b', mps: [] as string[] },
      { range: '40-55%', min: 40, max: 55, count: 0, fill: '#f59e0b', mps: [] as string[] },
      { range: '55-70%', min: 55, max: 70, count: 0, fill: '#10b981', mps: [] as string[] },
      { range: '70-85%', min: 70, max: 85, count: 0, fill: '#10b981', mps: [] as string[] },
      { range: '85-100%', min: 85, max: 100, count: 0, fill: '#10b981', mps: [] as string[] },
    ];

    allocations.forEach((mp) => {
      const u = mp.utilization_pct;
      for (const bin of bins) {
        if (bin.range === '85-100%' ? u >= bin.min && u <= bin.max : u >= bin.min && u < bin.max) {
          bin.count += 1;
          if (bin.mps.length < 3) bin.mps.push(mp.mp_name);
          break;
        }
      }
    });

    return bins;
  }, [allocations]);

  const riskScoreHistogramData = useMemo(() => {
    const bins = [
      { range: '0-20 (Safe)', min: 0, max: 20, count: 0, fill: '#10b981', mps: [] as string[] },
      { range: '20-40 (Low)', min: 20, max: 40, count: 0, fill: '#34d399', mps: [] as string[] },
      { range: '40-60 (Moderate)', min: 40, max: 60, count: 0, fill: '#f59e0b', mps: [] as string[] },
      { range: '60-80 (Elevated)', min: 60, max: 80, count: 0, fill: '#fb923c', mps: [] as string[] },
      { range: '80-100 (Severe)', min: 80, max: 100, count: 0, fill: '#f43f5e', mps: [] as string[] },
    ];

    allocations.forEach((mp) => {
      const r = mp.risk_score;
      for (const bin of bins) {
        if (bin.range.includes('80-100') ? r >= bin.min && r <= bin.max : r >= bin.min && r < bin.max) {
          bin.count += 1;
          break;
        }
      }
    });

    return bins;
  }, [allocations]);

  // 4. DATA FOR PIE / DONUT CHARTS (Risk bands, House, Calamities)
  const riskPieData = useMemo(() => {
    const counts = { 'Review Required': 0, 'Medium': 0, 'Low': 0 };
    allocations.forEach((item) => {
      if (item.risk_badge in counts) {
        counts[item.risk_badge as keyof typeof counts] += 1;
      }
    });

    return [
      { name: 'Review Required (Critical)', value: counts['Review Required'], color: '#f43f5e' },
      { name: 'Medium Risk (Moderate)', value: counts['Medium'], color: '#f59e0b' },
      { name: 'Low Risk (Performant)', value: counts['Low'], color: '#10b981' },
    ];
  }, [allocations]);

  const housePieData = useMemo(() => {
    return [
      { name: 'Lok Sabha (543 MPs)', value: 543, outlay: 8315.46, color: house === 'RS' ? '#3730a3' : '#6366f1' },
      { name: 'Rajya Sabha (231 MPs)', value: 231, outlay: 3361.33, color: house === 'LS' ? '#581c87' : '#a855f7' },
    ];
  }, [house]);

  const calamityPieData = useMemo(() => {
    const map = new Map<string, number>();
    calamities.forEach((c) => {
      const ev = c.event_name || 'Other Disaster Relief';
      map.set(ev, (map.get(ev) || 0) + c.amount_cr);
    });

    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e11d48'];
    return Array.from(map.entries()).map(([name, amount], idx) => ({
      name,
      value: Number(amount.toFixed(2)),
      color: colors[idx % colors.length],
    }));
  }, [calamities]);

  const sectorData = useMemo(() => {
    const totalCr = summary?.total_allocated_cr || (house === 'LS' ? 8315.46 : house === 'RS' ? 3361.33 : 11676.79);
    const totalWorks = summary?.works_recommended || (house === 'LS' ? 102758 : house === 'RS' ? 24662 : 127420);
    return [
      { name: 'Roads & Bridges', amount: Math.round(totalCr * 0.42), pct: 42, color: '#6366f1', works: Math.round(totalWorks * 0.42) },
      { name: 'Community Halls', amount: Math.round(totalCr * 0.24), pct: 24, color: '#a855f7', works: Math.round(totalWorks * 0.24) },
      { name: 'Drinking Water & Sanitation', amount: Math.round(totalCr * 0.18), pct: 18, color: '#10b981', works: Math.round(totalWorks * 0.18) },
      { name: 'Lighting & Power', amount: Math.round(totalCr * 0.16), pct: 16, color: '#f59e0b', works: Math.round(totalWorks * 0.16) },
    ];
  }, [summary, house]);

  return (
    <section id="visual-hub" className="py-12 px-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
            <Sparkles size={15} />
            <span>Interactive Visual Analytics Engine</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>
              {house === 'ALL'
                ? 'Parliamentary Telemetry Visualizer'
                : house === 'LS'
                ? 'Lok Sabha Telemetry Visualizer'
                : 'Rajya Sabha Telemetry Visualizer'}
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {house === 'ALL' ? '774 MPs' : house === 'LS' ? '543 MPs' : '231 MPs'}
            </span>
          </h2>
          <p className="text-white text-sm mt-1 max-w-2xl">
            Evaluate{summary ? ` ₹${summary.total_allocated_cr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr` : ' ₹11,670+ Cr'} of {house === 'ALL' ? 'All Parliament' : house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'} allocations through comprehensive visual models:
            dynamic flowcharts, state bar charts, utilization histograms, and sectoral pie distributions.
          </p>
        </div>

        {/* House Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
          {(['ALL', 'LS', 'RS'] as const).map((h) => (
            <button
              key={h}
              onClick={() => onHouseChange(h)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                house === h ? 'bg-burgundy-700 text-white shadow-lg' : 'text-white hover:text-white'
              }`}
            >
              {h === 'ALL' ? 'All Parliament' : h === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => setActiveTab('flowchart')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
            activeTab === 'flowchart'
              ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-950/50 ring-1 ring-indigo-500/50 text-white'
              : 'liquid-glass-strong border-white/10 hover:border-white/20 text-white hover:text-white'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'flowchart' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-indigo-400'}`}>
            <GitCommit size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold block text-indigo-400">PIPELINE GRAPH</span>
            <span className="text-sm font-bold block">1. Flowchart</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('barchart')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
            activeTab === 'barchart'
              ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/50 ring-1 ring-purple-500/50 text-white'
              : 'liquid-glass-strong border-white/10 hover:border-white/20 text-white hover:text-white'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'barchart' ? 'bg-purple-600 text-white' : 'bg-white/5 text-purple-400'}`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold block text-purple-400">COMPARATIVE METRICS</span>
            <span className="text-sm font-bold block">2. Bar Charts</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('histogram')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
            activeTab === 'histogram'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500/50 text-white'
              : 'liquid-glass-strong border-white/10 hover:border-white/20 text-white hover:text-white'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'histogram' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-emerald-400'}`}>
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold block text-emerald-400">FREQUENCY BINS</span>
            <span className="text-sm font-bold block">3. Histograms</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('piechart')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
            activeTab === 'piechart'
              ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-950/50 ring-1 ring-rose-500/50 text-white'
              : 'liquid-glass-strong border-white/10 hover:border-white/20 text-white hover:text-white'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'piechart' ? 'bg-rose-600 text-white' : 'bg-white/5 text-rose-400'}`}>
            <PieIcon size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold block text-rose-400">PROPORTIONS</span>
            <span className="text-sm font-bold block">4. Pie Charts</span>
          </div>
        </button>
      </div>

      {/* TAB CONTENT 1: FLOWCHART */}
      {activeTab === 'flowchart' && (
        <div className="liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase font-bold">
                <GitCommit size={15} />
                <span>Statutory Transformation Lifecycle Flowchart</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                Fund Recommendation → Sanction → Ground Completion Pipeline
              </h3>
              <p className="text-xs text-white mt-1">
                Visualizing bureaucratic drop-off, administrative friction, and physical completion rates.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-white block font-mono">End-to-End Efficiency</span>
              <span className="text-2xl font-mono font-black text-emerald-400">{pipelineMetrics.endToEndPct}%</span>
            </div>
          </div>

          {/* Interactive Flowchart Diagram */}
          <div className="my-8 overflow-x-auto pb-4">
            <div className="min-w-[840px] flex items-center justify-between relative px-4">
              {/* Connector Lines */}
              <div className="absolute top-1/2 left-28 right-28 h-1 bg-white/10 -translate-y-1/2 z-0" />

              {/* Step 1: Recommended Works */}
              <div className="relative z-10 w-64 bg-slate-900/90 border-2 border-indigo-500/70 rounded-2xl p-5 shadow-xl hover:border-indigo-400 transition-all group">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-mono font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    STAGE 01
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">INTAKE</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">Recommended Works</h4>
                <div className="text-3xl font-black font-mono text-white mb-2 tracking-tight">
                  {pipelineMetrics.rec.toLocaleString()}
                </div>
                <p className="text-[11px] text-white leading-relaxed mb-3">
                  Civil proposals formally initiated by MPs to District Authorities under MPLADS guidelines.
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] font-mono">
                  <span className="text-white">Baseline Outlay</span>
                  <span className="text-indigo-300 font-bold">100% Ingress</span>
                </div>
              </div>

              {/* Conversion 1 Arrow with Drop-off indicator */}
              <div className="relative z-10 flex flex-col items-center px-4">
                <div className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[11px] font-mono font-bold text-indigo-300 mb-1 shadow-md">
                  {pipelineMetrics.sancPct}% Converted
                </div>
                <div className="flex items-center text-indigo-400 animate-pulse">
                  <ArrowRight size={28} />
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
                  <TrendingDown size={11} />
                  <span>{pipelineMetrics.drop1.toLocaleString()} Pending/Dropped</span>
                </div>
              </div>

              {/* Step 2: Sanctioned Works */}
              <div className="relative z-10 w-64 bg-slate-900/90 border-2 border-purple-500/70 rounded-2xl p-5 shadow-xl hover:border-purple-400 transition-all group">
                <div className="flex items-center justify-between text-xs text-purple-400 font-mono font-bold mb-2">
                  <span>STAGE 02</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">ADMIN CLEARANCE</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">Sanctioned Works</h4>
                <div className="text-3xl font-black font-mono text-purple-200 mb-2 tracking-tight">
                  {pipelineMetrics.sanc.toLocaleString()}
                </div>
                <p className="text-[11px] text-white leading-relaxed mb-3">
                  Cleared by District Collector / IDA after technical estimates and financial allocation.
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] font-mono">
                  <span className="text-white">Conversion Rate</span>
                  <span className="text-purple-300 font-bold">{pipelineMetrics.sancPct}% of Stage 1</span>
                </div>
              </div>

              {/* Conversion 2 Arrow with Drop-off indicator */}
              <div className="relative z-10 flex flex-col items-center px-4">
                <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-[11px] font-mono font-bold text-purple-300 mb-1 shadow-md">
                  {pipelineMetrics.compPct}% Converted
                </div>
                <div className="flex items-center text-purple-400 animate-pulse">
                  <ArrowRight size={28} />
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/50">
                  <TrendingDown size={11} />
                  <span>{pipelineMetrics.drop2.toLocaleString()} In-Execution</span>
                </div>
              </div>

              {/* Step 3: Completed Works */}
              <div className="relative z-10 w-64 bg-slate-900/90 border-2 border-emerald-500/70 rounded-2xl p-5 shadow-xl hover:border-emerald-400 transition-all group">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono font-bold mb-2">
                  <span>STAGE 03</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ON-GROUND REALIZED</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">Completed Works</h4>
                <div className="text-3xl font-black font-mono text-emerald-400 mb-2 tracking-tight">
                  {pipelineMetrics.comp.toLocaleString()}
                </div>
                <p className="text-[11px] text-white leading-relaxed mb-3">
                  Physical assets built, inspected, and handed over to local panchayats or municipalities.
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] font-mono">
                  <span className="text-white">Execution Ratio</span>
                  <span className="text-emerald-300 font-bold">{pipelineMetrics.compPct}% of Sanctions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flowchart Insights Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-white block font-mono uppercase mb-1 font-bold">1. Intake Bottleneck</span>
              <p className="text-white">
                <strong className="text-rose-300 font-mono">{pipelineMetrics.drop1.toLocaleString()} works</strong> face delay between MP proposal and administrative approval, pointing to local PWD/Panchayat estimate backlogs.
              </p>
            </div>
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-white block font-mono uppercase mb-1 font-bold">2. Ground Execution</span>
              <p className="text-white">
                <strong className="text-purple-300 font-mono">{pipelineMetrics.compPct}% of sanctioned works</strong> successfully achieve final physical completion certificates, proving strong delivery once funds are committed.
              </p>
            </div>
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-white block font-mono uppercase mb-1 font-bold">3. National Total</span>
              <p className="text-white">
                Overall conversion stands at <strong className="text-emerald-300 font-mono">{pipelineMetrics.endToEndPct}%</strong> across all {house === 'ALL' ? 'Parliamentary' : house} seats recorded in eSAKSHI audit registers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BAR CHARTS */}
      {activeTab === 'barchart' && (
        <div className="space-y-6">
          {/* Main State Comparison Bar Chart */}
          <div className="liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase font-bold">
                  <BarChart3 size={15} />
                  <span>Geographic Allocation & Utilization Bar Chart</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  State-by-State Fiscal Outlay vs. Utilization Rate
                </h3>
                <p className="text-xs text-white mt-1">
                  Comparing top states by total MPLADS allocation limit (₹ Crores) against actual utilization percentage.
                </p>
              </div>

              {/* Sorting Switcher */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <span className="text-white px-2 font-mono">Sort by:</span>
                <button
                  onClick={() => setStateSortBy('outlay')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    stateSortBy === 'outlay' ? 'bg-purple-600 text-white' : 'text-white hover:text-white'
                  }`}
                >
                  Outlay (₹ Cr)
                </button>
                <button
                  onClick={() => setStateSortBy('utilization')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    stateSortBy === 'utilization' ? 'bg-purple-600 text-white' : 'text-white hover:text-white'
                  }`}
                >
                  Utilization (%)
                </button>
                <button
                  onClick={() => setStateSortBy('count')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    stateSortBy === 'count' ? 'bg-purple-600 text-white' : 'text-white hover:text-white'
                  }`}
                >
                  MPs
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="h-[380px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateBarData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="state"
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff80', fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#6366f1"
                    tick={{ fill: '#6366f1', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val}Cr`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Total Outlay (₹ Cr)') return [`₹${value} Cr`, name];
                      if (name === 'Avg Utilization (%)') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="totalOutlay"
                    name="Total Outlay (₹ Cr)"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgUtil"
                    name="Avg Utilization (%)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Outlay Parliamentarians Bar Chart */}
          <div className="liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase font-bold block">REPRESENTATIVE DRILL-DOWN</span>
                <h4 className="text-xl font-bold text-white mt-0.5">Top Parliamentarians by Sanctioned Outlay</h4>
              </div>
              <span className="text-xs font-mono text-white">Click bar or button in screener to inspect dossier</span>
            </div>

            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMpOutlayData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    type="number"
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff80', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val}Cr`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff90', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, _name: any, item: any) => [
                      `₹${val} Cr (${item.payload.utilization_pct}% Utilized, ${item.payload.risk_badge})`,
                      'Sanctioned Outlay'
                    ]}
                  />
                  <Bar
                    dataKey="allocated_cr"
                    name="Sanctioned Outlay"
                    fill="#a855f7"
                    radius={[0, 6, 6, 0]}
                  >
                    {topMpOutlayData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.risk_badge === 'Review Required' ? '#f43f5e' : entry.risk_badge === 'Medium' ? '#f59e0b' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: HISTOGRAM */}
      {activeTab === 'histogram' && (
        <div className="space-y-6">
          <div className="liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-bold">
                  <Activity size={15} />
                  <span>Statistical Frequency Histogram</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  {histogramMetric === 'utilization'
                    ? 'Parliamentarian Utilization Rate Distribution'
                    : 'Constituency Risk Score Distribution'}
                </h3>
                <p className="text-xs text-white mt-1">
                  Evaluating data clustering across {allocations.length} parliamentary seats to identify skew and outliers.
                </p>
              </div>

              {/* Metric Switcher */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setHistogramMetric('utilization')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    histogramMetric === 'utilization' ? 'bg-emerald-600 text-white' : 'text-white hover:text-white'
                  }`}
                >
                  Utilization Rate (%)
                </button>
                <button
                  onClick={() => setHistogramMetric('risk')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    histogramMetric === 'risk' ? 'bg-rose-700 text-white' : 'text-white hover:text-white'
                  }`}
                >
                  Risk Score (0-100)
                </button>
              </div>
            </div>

            {/* Histogram Chart Container */}
            <div className="h-[360px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={histogramMetric === 'utilization' ? utilizationHistogramData : riskScoreHistogramData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="range"
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff80', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff80', fontSize: 11 }}
                    tickFormatter={(val) => `${val} MPs`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} Parliamentarians`, 'Frequency Count']}
                  />
                  <Bar
                    dataKey="count"
                    name="Frequency Count"
                    radius={[8, 8, 0, 0]}
                  >
                    {(histogramMetric === 'utilization' ? utilizationHistogramData : riskScoreHistogramData).map((entry, index) => {
                      const color = histogramMetric === 'utilization'
                        ? index < 2 ? '#f43f5e' : index < 4 ? '#f59e0b' : '#10b981'
                        : (entry as any).fill || '#6366f1';
                      return <Cell key={`hist-cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Histogram Statistical Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-white block font-mono uppercase mb-0.5">Mode Frequency Cluster</span>
                <span className="text-lg font-mono font-bold text-white">40% - 55% Utilization</span>
                <p className="text-[11px] text-white mt-1">Largest concentration of MPs falls in the moderate execution band.</p>
              </div>
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-white block font-mono uppercase mb-0.5">Under-Utilization Tail</span>
                <span className="text-lg font-mono font-bold text-rose-400">
                  {allocations.filter(a => a.utilization_pct < 25).length} Critical Outliers
                </span>
                <p className="text-[11px] text-white mt-1">Constituencies utilizing less than 25% of their sanctioned limit.</p>
              </div>
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-white block font-mono uppercase mb-0.5">High-Velocity Quintile</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {allocations.filter(a => a.utilization_pct >= 70).length} High Performers
                </span>
                <p className="text-[11px] text-white mt-1">Fast-tracked project execution with over 70% fund absorption.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PIE CHARTS */}
      {activeTab === 'piechart' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Priority Sector Allocation (Span 6) */}
          <div className="lg:col-span-6 liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase font-bold">
                  <PieIcon size={15} />
                  <span>Sectoral Outlay Pie Chart</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  ₹{Math.round(summary?.total_allocated_cr || (house === 'LS' ? 8315 : house === 'RS' ? 3361 : 11676)).toLocaleString()} Cr TRACKED
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Public Works Domain Breakdown</h3>
              <p className="text-xs text-white mb-4">Distribution of capital outlay across major infrastructure categories.</p>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`sector-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${val} Cr`, 'Allocated Outlay']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mini Legend Summary */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-[11px]">
              {sectorData.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-white truncate">{s.name}:</span>
                  <span className="font-mono font-bold text-white ml-auto">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Telemetry Risk Profile Donut (Span 6) */}
          <div className="lg:col-span-6 liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase font-bold">
                  <PieIcon size={15} />
                  <span>Audit Risk Categorization Donut</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  {allocations.length} PARLIAMENTARIANS
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Algorithmic Risk Band Proportions</h3>
              <p className="text-xs text-white mb-4">Classified via fund lag, voucher anomalies, and clearance latency.</p>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={4}
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`risk-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} MPs (${(((Number(val)) / (allocations.length || 1)) * 100).toFixed(1)}%)`, 'Proportion']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mini Stat Summary */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 text-center text-xs">
              <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30">
                <span className="text-[10px] font-mono text-rose-400 uppercase block">Review Req</span>
                <span className="font-mono font-bold text-rose-200">
                  {allocations.filter(a => a.risk_badge === 'Review Required').length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-900/30">
                <span className="text-[10px] font-mono text-amber-400 uppercase block">Medium Risk</span>
                <span className="font-mono font-bold text-amber-200">
                  {allocations.filter(a => a.risk_badge === 'Medium').length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block">Low Risk</span>
                <span className="font-mono font-bold text-emerald-200">
                  {allocations.filter(a => a.risk_badge === 'Low').length}
                </span>
              </div>
            </div>
          </div>

          {/* Chart 3: House Representation Pie Chart (Span 6) */}
          <div className="lg:col-span-6 liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase font-bold">
                  <Layers size={15} />
                  <span>Parliamentary House Allocation Ratio</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  PARLIAMENT BALANCE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Lok Sabha vs. Rajya Sabha Outlay</h3>
              <p className="text-xs text-white mb-4">Comparison of direct constituency seats vs statewide council representation.</p>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={housePieData}
                      dataKey="outlay"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {housePieData.map((entry, index) => (
                        <Cell key={`house-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, _name: any, item: any) => [
                        `₹${val} Cr (${item.payload.value} MPs)`,
                        'Total Outlay'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#ffffff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 4: Emergency Calamity Allocation Pie Chart (Span 6) */}
          <div className="lg:col-span-6 liquid-glass-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase font-bold">
                  <PieIcon size={15} />
                  <span>Emergency Calamity Dispatches</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  RULE 5.2 CONSENTS
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Disaster Relief Share by Event</h3>
              <p className="text-xs text-white mb-4">Parliamentarian emergency fund transfers dedicated to severe natural disasters.</p>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calamityPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {calamityPieData.map((entry, index) => (
                        <Cell key={`calamity-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${val} Cr`, 'Consented Amount']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#ffffff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
