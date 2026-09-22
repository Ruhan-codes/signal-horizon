import { useEffect, useState } from 'react';
import { api, crore } from '../lib/signal-api';
import type { MPAllocation, LegalDocsResponse, OptimalBudgetResponse } from '../lib/signal-types';
import { Search, Filter, AlertTriangle, CheckCircle, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TerminalScreener({
  house,
  onHouseChange,
}: {
  house: 'ALL' | 'LS' | 'RS';
  onHouseChange?: (house: 'ALL' | 'LS' | 'RS') => void;
}) {
  const [allocations, setAllocations] = useState<MPAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedMp, setSelectedMp] = useState<MPAllocation | null>(null);

  const [riskCategory, setRiskCategory] = useState<'ALL' | 'Review Required' | 'Medium' | 'Low'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Tab & Civic Action States
  const [activeTab, setActiveTab] = useState<'dossier' | 'works' | 'action' | 'budget'>('dossier');
  const [legalDocs, setLegalDocs] = useState<LegalDocsResponse | null>(null);
  const [legalDocType, setLegalDocType] = useState<'rti' | 'appeal' | 'pil'>('rti');
  const [optimalBudget, setOptimalBudget] = useState<OptimalBudgetResponse | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [mpWorks, setMpWorks] = useState<any[]>([]);
  const [isMpWorksLoading, setIsMpWorksLoading] = useState(false);

  useEffect(() => {
    if (selectedMp) {
      setIsMpWorksLoading(true);
      api.getWorks(undefined, undefined, selectedMp.mp_name).then((data) => {
        setMpWorks(data);
        setIsMpWorksLoading(false);
      });
    } else {
      setMpWorks([]);
    }
  }, [selectedMp]);

  useEffect(() => {
    setLoading(true);
    api.getAllocations(house).then((data) => {
      setAllocations(data);
      setLoading(false);
    });
  }, [house]);

  const handleGenerateLegalDocs = async () => {
    if (!selectedMp) return;
    setIsActionLoading(true);
    const res = await api.generateLegalDocs(selectedMp);
    setLegalDocs(res);
    setIsActionLoading(false);
  };

  const handleGenerateOptimalBudget = async () => {
    if (!selectedMp) return;
    setIsActionLoading(true);
    const res = await api.generateOptimalBudget(selectedMp);
    setOptimalBudget(res);
    setIsActionLoading(false);
  };

  // Compute counts for each category under current search/state
  const reviewCount = allocations.filter(a => a.risk_badge === 'Review Required').length;
  const mediumCount = allocations.filter(a => a.risk_badge === 'Medium').length;
  const lowCount = allocations.filter(a => a.risk_badge === 'Low').length;

  const filtered = allocations.filter(item => {
    const matchesSearch = item.mp_name.toLowerCase().includes(search.toLowerCase()) ||
                          item.constituency.toLowerCase().includes(search.toLowerCase());
    const matchesState = selectedState === 'ALL' || item.state === selectedState;
    const matchesRisk = riskCategory === 'ALL' || item.risk_badge === riskCategory;
    return matchesSearch && matchesState && matchesRisk;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const states = ['ALL', ...Array.from(new Set(allocations.map(a => a.state))).sort()];

  const handleCategorySelect = (cat: 'ALL' | 'Review Required' | 'Medium' | 'Low') => {
    setRiskCategory(cat);
    setCurrentPage(1);
  };

  return (
    <section id="screener" className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
            <Filter size={14} />
            <span>Parliamentary Screener Engine</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>
              {house === 'ALL'
                ? 'Parliamentary Risk Terminal'
                : house === 'LS'
                ? 'Lok Sabha Risk Terminal'
                : 'Rajya Sabha Risk Terminal'}
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {allocations.length} Members
            </span>
          </h2>
          <p className="text-sm text-white mt-1">
            Filter {house === 'ALL' ? 'all parliamentarians' : house === 'LS' ? '543 Lok Sabha MPs' : '231 Rajya Sabha MPs'} by risk category to prioritize civic audits.
          </p>
        </div>

        {/* Global Search, State Filter & House Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onHouseChange && (
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
              {(['ALL', 'LS', 'RS'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    onHouseChange(h);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    house === h ? 'bg-burgundy-700 text-white shadow-lg' : 'text-white hover:text-white'
                  }`}
                >
                  {h === 'ALL' ? 'All Parliament' : h === 'LS' ? 'Lok Sabha' : 'Rajya Sabha'}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 md:w-64 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={16} />
            <input
              type="text"
              placeholder="Search MP or Constituency..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
            className="w-44 shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {states.map(s => <option key={s} value={s} className="bg-obsidian">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Categorized Risk Summary Boxes with Inside House Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Box 1: All MPs */}
        <div
          onClick={() => handleCategorySelect('ALL')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
            riskCategory === 'ALL'
              ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
              : 'liquid-glass-strong border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-white">Complete Roster</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-white/10 text-white">
                {riskCategory === 'ALL' ? 'ACTIVE' : 'SELECT'}
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-white tracking-tight">
              {allocations.length}
            </div>
            <p className="text-xs text-white mt-1">
              {house === 'ALL' ? 'All Parliamentarians' : house === 'LS' ? 'Lok Sabha MPs' : 'Rajya Sabha MPs'} Monitored
            </p>
          </div>

          {riskCategory === 'ALL' && onHouseChange && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-mono text-white uppercase">Scope:</span>
              <div className="flex bg-black/40 p-0.5 rounded-lg text-xs border border-white/10">
                {(['ALL', 'LS', 'RS'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => { onHouseChange(h); setCurrentPage(1); }}
                    className={`w-8 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                      house === h ? 'bg-indigo-600 text-white font-bold' : 'text-white hover:text-white'
                    }`}
                  >
                    {h === 'ALL' ? 'All' : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Box 2: Review Required (Critical) */}
        <div
          onClick={() => handleCategorySelect('Review Required')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
            riskCategory === 'Review Required'
              ? 'bg-rose-950/50 border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/50'
              : 'liquid-glass-strong border-white/10 hover:border-rose-900/50 hover:bg-rose-950/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Review Required</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300">
                {riskCategory === 'Review Required' ? 'ACTIVE' : 'CRITICAL'}
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-rose-400 tracking-tight">
              {reviewCount}
            </div>
            <p className="text-xs text-rose-200 mt-1">High disparity or execution anomalies</p>
          </div>

          {riskCategory === 'Review Required' && onHouseChange && (
            <div className="mt-4 pt-3 border-t border-rose-900/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-mono text-rose-300 uppercase">Scope:</span>
              <div className="flex bg-black/40 p-0.5 rounded-lg text-xs border border-rose-500/20">
                {(['ALL', 'LS', 'RS'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => { onHouseChange(h); setCurrentPage(1); }}
                    className={`w-8 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                      house === h ? 'bg-rose-700 text-white font-bold' : 'text-rose-200 hover:text-white'
                    }`}
                  >
                    {h === 'ALL' ? 'All' : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Box 3: Medium Risk */}
        <div
          onClick={() => handleCategorySelect('Medium')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
            riskCategory === 'Medium'
              ? 'bg-amber-950/50 border-amber-500 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/50'
              : 'liquid-glass-strong border-white/10 hover:border-amber-900/50 hover:bg-amber-950/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-amber-400">Moderate Variance</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300">
                {riskCategory === 'Medium' ? 'ACTIVE' : 'MEDIUM'}
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-amber-400 tracking-tight">
              {mediumCount}
            </div>
            <p className="text-xs text-amber-200 mt-1">Intermediate pace or pending clearances</p>
          </div>

          {riskCategory === 'Medium' && onHouseChange && (
            <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-mono text-amber-300 uppercase">Scope:</span>
              <div className="flex bg-black/40 p-0.5 rounded-lg text-xs border border-amber-500/20">
                {(['ALL', 'LS', 'RS'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => { onHouseChange(h); setCurrentPage(1); }}
                    className={`w-8 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                      house === h ? 'bg-amber-600 text-white font-bold' : 'text-amber-200 hover:text-white'
                    }`}
                  >
                    {h === 'ALL' ? 'All' : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Box 4: Low Risk */}
        <div
          onClick={() => handleCategorySelect('Low')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
            riskCategory === 'Low'
              ? 'bg-emerald-950/50 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
              : 'liquid-glass-strong border-white/10 hover:border-emerald-900/50 hover:bg-emerald-950/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>Optimal Delivery</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300">
                {riskCategory === 'Low' ? 'ACTIVE' : 'LOW'}
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
              {lowCount}
            </div>
            <p className="text-xs text-emerald-200/60 mt-1">High conversion & low anomaly score</p>
          </div>

          {riskCategory === 'Low' && onHouseChange && (
            <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-mono text-emerald-300 uppercase">Scope:</span>
              <div className="flex bg-black/40 p-0.5 rounded-lg text-xs border border-emerald-500/20">
                {(['ALL', 'LS', 'RS'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => { onHouseChange(h); setCurrentPage(1); }}
                    className={`w-8 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                      house === h ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200/60 hover:text-white'
                    }`}
                  >
                    {h === 'ALL' ? 'All' : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Active Filter Header & Status */}
      <div className="flex items-center justify-between mb-3 px-1 text-xs text-white">
        <div>
          <span>Showing </span>
          <span className="font-bold text-white">
            {riskCategory === 'ALL' ? 'All Parliamentarians' : `${riskCategory} Risk Category`}
          </span>
          <span> ({filtered.length} records found)</span>
        </div>
        <div>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Terminal Data Table */}
      <div className="overflow-x-auto liquid-glass-strong rounded-2xl border border-white/10 shadow-2xl">
        <table className="w-full text-left text-sm text-white">
          <thead className="bg-white/[0.04] text-xs uppercase font-mono text-white border-b border-white/10 tracking-wider">
            <tr>
              <th className="py-4 px-5">Hon'ble MP</th>
              <th className="py-4 px-5">Constituency / State</th>
              <th className="py-4 px-5">House</th>
              <th className="py-4 px-5">Allocated Limit</th>
              <th className="py-4 px-5">Fund Utilization</th>
              <th className="py-4 px-5">Risk Band</th>
              <th className="py-4 px-5 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-white/[0.06] cursor-pointer transition-colors group"
                onClick={() => setSelectedMp(row)}
              >
                <td className="py-4 px-5 font-bold text-white text-base leading-snug group-hover:text-indigo-200 transition-colors">
                  {row.mp_name}
                </td>
                <td className="py-4 px-5">
                  <span className="block font-semibold text-white text-sm">{row.constituency || 'Statewide'}</span>
                  <span className="text-xs text-white">{row.state}</span>
                </td>
                <td className="py-4 px-5">
                  <span className="inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                    {row.house}
                  </span>
                </td>
                <td className="py-4 px-5 font-mono font-extrabold text-base text-white">
                  {crore(row.allocated_cr)}
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, row.utilization_pct))}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-300">{row.utilization_pct}%</span>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    row.risk_badge === 'Low'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : row.risk_badge === 'Medium'
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                  }`}>
                    {row.risk_badge === 'Low' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {row.risk_badge} ({row.risk_score})
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMp(row);
                    }}
                    className="text-indigo-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-indigo-600 transition-all group-hover:scale-105 inline-flex items-center justify-center"
                    title="Inspect MP Profile"
                  >
                    <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-indigo-400 font-mono text-sm animate-pulse">
                  Synchronizing parliamentary allocation records from eSAKSHI...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white text-base">
                  No parliamentary records found for this category or filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/10 bg-white/[0.02] text-xs text-white">
            <div>
              Showing <span className="font-bold text-white">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of{' '}
              <span className="font-bold text-white">{filtered.length}</span> parliamentarians
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 px-2 font-mono font-semibold text-white">
                <span className="text-white">{currentPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium flex items-center gap-1 transition-all"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Audit Drawer */}
      {selectedMp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-obsidian liquid-glass-strong border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-mono text-indigo-400 tracking-wider">AUDIT TELEMETRY // CIVIC ACTION RADAR</span>
                <button onClick={() => { setSelectedMp(null); setLegalDocs(null); setOptimalBudget(null); }} className="text-white hover:text-white p-1 rounded hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-2xl font-black text-white">{selectedMp.mp_name}</h3>
                <p className="text-sm text-white">{selectedMp.constituency || 'Statewide'}, {selectedMp.state} ({selectedMp.house})</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl mb-5 text-xs font-semibold border border-white/10">
                {(['dossier', 'works', 'action', 'budget'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      activeTab === tab
                        ? 'bg-burgundy-700 text-white font-bold shadow-lg'
                        : 'text-white hover:text-white'
                    }`}
                  >
                    {tab === 'dossier' ? 'Dossier' : tab === 'works' ? `Ground Works (${mpWorks.length})` : tab === 'action' ? 'Civic Action' : 'AI Budget'}
                  </button>
                ))}
              </div>

              {/* Tab 1: Dossier */}
              {activeTab === 'dossier' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-white block mb-1">Allocated Limit</span>
                      <span className="font-mono text-xl font-black text-white">{crore(selectedMp.allocated_cr)}</span>
                    </div>
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-white block mb-1">Fund Utilization</span>
                      <span className="font-mono text-xl font-black text-emerald-400">{selectedMp.utilization_pct}%</span>
                    </div>
                  </div>

                  {/* Individual MP Visual Flowchart */}
                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-mono text-indigo-400 font-bold uppercase">MP Flowchart Pipeline</span>
                      <span className="text-white font-mono">
                        {selectedMp.recommended_count && selectedMp.recommended_count > 0
                          ? `${(((selectedMp.sanctioned_count ?? 0) / selectedMp.recommended_count) * 100).toFixed(0)}% Sanc Velocity`
                          : 'Official Record'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-center text-xs">
                      {/* Rec Node */}
                      <div className="flex-1 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                        <span className="text-[10px] text-indigo-400 font-mono block">STAGE 1</span>
                        <span className="font-mono font-bold text-sm text-white block">
                          {selectedMp.recommended_count ?? 0}
                        </span>
                        <span className="text-[10px] text-white">Recommended</span>
                      </div>

                      <div className="text-indigo-400">
                        <ArrowRight size={14} />
                      </div>

                      {/* Sanc Node */}
                      <div className="flex-1 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                        <span className="text-[10px] text-purple-400 font-mono block">STAGE 2</span>
                        <span className="font-mono font-bold text-sm text-purple-200 block">
                          {selectedMp.sanctioned_count ?? 0}
                        </span>
                        <span className="text-[10px] text-white">Sanctioned</span>
                      </div>

                      <div className="text-purple-400">
                        <ArrowRight size={14} />
                      </div>

                      {/* Comp Node */}
                      <div className="flex-1 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 font-mono block">STAGE 3</span>
                        <span className="font-mono font-bold text-sm text-emerald-300 block">
                          {selectedMp.completed_count ?? 0}
                        </span>
                        <span className="text-[10px] text-white">Completed</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(5, selectedMp.recommended_count ? ((selectedMp.sanctioned_count ?? 0) / selectedMp.recommended_count) * 100 : selectedMp.utilization_pct))}%`
                        }}
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-4">Parliamentary Delivery Diagnostics</h4>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-white/5 rounded-xl text-xs space-y-1.5 border border-white/5">
                      <div className="flex justify-between text-white font-medium">
                        <span>Telemetry Risk Classification</span>
                        <span className={`font-mono font-bold ${
                          selectedMp.risk_badge === 'Low' ? 'text-emerald-400' : selectedMp.risk_badge === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {selectedMp.risk_badge} (Risk Score: {selectedMp.risk_score})
                        </span>
                      </div>
                      <p className="text-[11px] text-white">
                        Data-derived risk score computed from fund lag, unspent ratio, and peer state averages.
                      </p>
                    </div>

                    {selectedMp.source_file && (
                      <div className="p-3 bg-white/5 rounded-xl text-[11px] text-white border border-white/5">
                        <span className="text-white block font-semibold mb-0.5">Source Disclosure File</span>
                        <span>{selectedMp.source_file}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Ground Works Breakdown */}
              {activeTab === 'works' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-white mb-2">
                    <span>Granular Projects ({mpWorks.length} Indexed)</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono">
                      Village & Agency Telemetry
                    </span>
                  </div>

                  {isMpWorksLoading ? (
                    <div className="py-12 text-center text-xs text-indigo-400 font-mono animate-pulse">
                      Retrieving granular ground projects...
                    </div>
                  ) : mpWorks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-white">
                      No itemized ground works records found for this representative.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {mpWorks.slice(0, 50).map((w, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white leading-snug flex-1">{w.work_name}</span>
                            {w.cost_cr > 0 && (
                              <span className="font-mono text-xs font-bold text-indigo-300 whitespace-nowrap">
                                {crore(w.cost_cr)}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 text-[10px] mt-2">
                            {w.status && (
                              <span className={`px-2 py-0.5 rounded font-semibold ${
                                w.status.includes('SANCTION') || w.status.includes('APPROV')
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                              }`}>
                                {w.status}
                              </span>
                            )}
                            {w.block && (
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                                Block: {w.block}
                              </span>
                            )}
                            {w.village && (
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                                Village: {w.village}
                              </span>
                            )}
                            {w.ida && (
                              <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 truncate max-w-[200px]" title={w.ida}>
                                IDA: {w.ida.replace('_IDA', '')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Civic Action Hub (Legal Assistant) */}
              {activeTab === 'action' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs">
                    <span className="font-bold text-amber-300 block mb-1">Accountability Escalation Engine</span>
                    <p className="text-white text-[11px]">
                      Generate legally-vetted RTI applications, Section 19(1) First Appeals, or PIL legal briefs demanding transparency for unspent or bottlenecked public funds.
                    </p>
                  </div>

                  {!legalDocs ? (
                    <button
                      onClick={handleGenerateLegalDocs}
                      disabled={isActionLoading}
                      className="w-full py-3 bg-burgundy-700 hover:bg-burgundy-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {isActionLoading ? 'Drafting Statutory Filings...' : 'Generate Legal Action Suite'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {(['rti', 'appeal', 'pil'] as const).map(d => (
                          <button
                            key={d}
                            onClick={() => setLegalDocType(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
                              legalDocType === d ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white hover:text-white'
                            }`}
                          >
                            {d === 'rti' ? 'RTI Application' : d === 'appeal' ? 'First Appeal' : 'PIL Brief'}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white whitespace-pre-wrap max-h-[320px] overflow-y-auto leading-relaxed">
                          {legalDocType === 'rti' && legalDocs.rti_application}
                          {legalDocType === 'appeal' && legalDocs.first_appeal}
                          {legalDocType === 'pil' && legalDocs.pil_brief}
                        </pre>
                        <button
                          onClick={() => {
                            const text = legalDocType === 'rti' ? legalDocs.rti_application : legalDocType === 'appeal' ? legalDocs.first_appeal : legalDocs.pil_brief;
                            navigator.clipboard.writeText(text);
                            alert("Copied document text to clipboard!");
                          }}
                          className="absolute top-3 right-3 px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white rounded"
                        >
                          Copy Text
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AI District Commissioner (Optimal Budget) */}
              {activeTab === 'budget' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs">
                    <span className="font-bold text-indigo-300 block mb-1">AI District Commissioner Model</span>
                    <p className="text-white text-[11px]">
                      Contrasts actual spending against an ideal needs-based allocation tailored to primary healthcare, potable drinking water, and rural connectivity.
                    </p>
                  </div>

                  {!optimalBudget ? (
                    <button
                      onClick={handleGenerateOptimalBudget}
                      disabled={isActionLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {isActionLoading ? 'Evaluating Needs Model...' : 'Generate Ideal Needs Allocation'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-white flex justify-between items-center mb-2">
                        <span>Optimal Distribution Profile (Pie Model)</span>
                        <span className="font-mono text-amber-400 font-bold">{crore(optimalBudget.total_allocated_cr)} Base</span>
                      </div>

                      {/* Visual Pie/Donut breakdown for MP's AI Budget */}
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-4">
                        <div className="relative w-28 h-28 shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {(() => {
                              let offset = 0;
                              const colors = ['#06b6d4', '#ec4899', '#6366f1', '#10b981', '#f59e0b'];
                              return optimalBudget.allocations.map((item, idx) => {
                                const dash = (item.pct * 2.387).toFixed(1);
                                const currentOffset = offset;
                                offset += item.pct * 2.387;
                                return (
                                  <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={colors[idx % colors.length]}
                                    strokeWidth="14"
                                    strokeDasharray={`${dash} 238.7`}
                                    strokeDashoffset={`-${currentOffset}`}
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-mono text-white">IDEAL</span>
                            <span className="text-xs font-mono font-bold text-white">5 SECTORS</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px] flex-1 min-w-0">
                          {optimalBudget.allocations.map((item, idx) => {
                            const colors = ['#06b6d4', '#ec4899', '#6366f1', '#10b981', '#f59e0b'];
                            return (
                              <div key={idx} className="flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1.5 text-white truncate">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                                  <span className="truncate">{item.category}</span>
                                </span>
                                <span className="font-mono font-bold text-white shrink-0">{item.pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                        {optimalBudget.allocations.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-white">{item.category}</span>
                              <div className="text-right">
                                <span className="font-mono text-xs font-bold text-indigo-300">{crore(item.amount_cr)}</span>
                                <span className="text-[10px] text-white block">({item.pct}%)</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-white mb-1.5 leading-snug">{item.justification}</p>
                            <div className="text-[10px] text-white font-mono bg-white/5 p-1.5 rounded">
                              Target: {item.example_project}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
