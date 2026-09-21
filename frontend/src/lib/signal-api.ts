import type {
  DashboardSummary,
  MPAllocation,
  CalamityConsent,
  MPLADWork,
  WorkExpenditure,
  LegalDocsResponse,
  OptimalBudgetResponse,
} from './signal-types';

const getApiBase = () => {
  if (import.meta.env.VITE_SIGNAL_API_BASE) {
    return import.meta.env.VITE_SIGNAL_API_BASE;
  }
  // In production the React app and FastAPI API are served from the same origin.
  if (typeof window !== 'undefined' && window.location.hostname) {
    return '/api/esakshi';
  }
  return '/api/esakshi';
};

const API_BASE = getApiBase();
const withHouse = (path: string, house?: 'ALL' | 'LS' | 'RS') =>
  house && house !== 'ALL' ? `${path}?house=${house}` : path;

export const api = {
  getSummary: async (house?: 'ALL' | 'LS' | 'RS'): Promise<DashboardSummary | null> => {
    try {
      const res = await fetch(`${API_BASE}${withHouse('/summary', house)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable:", e);
    }
    return null;
  },
  getAllocations: async (house?: 'ALL' | 'LS' | 'RS', q?: string, state?: string): Promise<MPAllocation[]> => {
    try {
      const params = new URLSearchParams();
      if (house && house !== 'ALL') params.append('house', house);
      if (q) params.append('q', q);
      if (state && state !== 'ALL') params.append('state', state);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/allocations${queryStr}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable:", e);
    }
    return [];
  },
  getCalamities: async (house?: 'ALL' | 'LS' | 'RS'): Promise<CalamityConsent[]> => {
    try {
      const res = await fetch(`${API_BASE}${withHouse('/calamities', house)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable:", e);
    }
    return [];
  },
  getWorks: async (house?: 'ALL' | 'LS' | 'RS', q?: string, mp?: string): Promise<MPLADWork[]> => {
    try {
      const params = new URLSearchParams();
      if (house && house !== 'ALL') params.append('house', house);
      if (q) params.append('q', q);
      if (mp) params.append('mp', mp);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/works${qs}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable:", e);
    }
    return [];
  },
  getExpenditures: async (): Promise<WorkExpenditure[]> => {
    try {
      const res = await fetch(`${API_BASE}/expenditures`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable:", e);
    }
    return [];
  },
  generateLegalDocs: async (mp: MPAllocation, finding?: string): Promise<LegalDocsResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/legal/generate-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mp_name: mp.mp_name,
          constituency: mp.constituency,
          state: mp.state,
          house: mp.house,
          allocated_cr: mp.allocated_cr,
          utilization_pct: mp.utilization_pct,
          risk_badge: mp.risk_badge,
          finding: finding,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Legal docs generation failed:", e);
    }
    return null;
  },
  generateOptimalBudget: async (mp: MPAllocation): Promise<OptimalBudgetResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/budget/generate-optimal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mp_name: mp.mp_name,
          constituency: mp.constituency,
          state: mp.state,
          house: mp.house,
          allocated_cr: mp.allocated_cr,
          utilization_pct: mp.utilization_pct,
          risk_badge: mp.risk_badge,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Optimal budget generation failed:", e);
    }
    return null;
  }
};

export const crore = (val: number) => `₹${val.toFixed(2)} Cr`;
export const compact = (val: number) => new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(val);
