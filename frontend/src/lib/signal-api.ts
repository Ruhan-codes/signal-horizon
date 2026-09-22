import type {
  DashboardSummary,
  MPAllocation,
  CalamityConsent,
  MPLADWork,
  WorkExpenditure,
  LegalDocsResponse,
  OptimalBudgetResponse,
} from './signal-types';
import {
  fallbackSummary,
  fallbackSummaryLS,
  fallbackSummaryRS,
  fallbackAllocations,
  fallbackCalamities,
  fallbackWorks,
  fallbackExpenditures,
} from './signal-dataset';

const getApiBase = () => {
  if (import.meta.env.VITE_SIGNAL_API_BASE) {
    return import.meta.env.VITE_SIGNAL_API_BASE;
  }
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
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (house === 'RS' && data.total_mps === 774) return fallbackSummaryRS;
        if (house === 'LS' && data.total_mps === 774) return fallbackSummaryLS;
        return data;
      }
    } catch {
      // Live backend unreachable - proceed to embedded dataset
    }
    // Static fallback using pre-extracted real eSAKSHI data
    if (house === 'LS') return fallbackSummaryLS;
    if (house === 'RS') return fallbackSummaryRS;
    return fallbackSummary;
  },

  getAllocations: async (house?: 'ALL' | 'LS' | 'RS', q?: string, state?: string): Promise<MPAllocation[]> => {
    let list: MPAllocation[] = [];
    try {
      const params = new URLSearchParams();
      if (house && house !== 'ALL') params.append('house', house);
      if (q) params.append('q', q);
      if (state && state !== 'ALL') params.append('state', state);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/allocations${queryStr}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        list = await res.json();
      }
    } catch {
      // Live backend unreachable - proceed to embedded dataset
    }

    if (!list || list.length === 0) {
      list = [...fallbackAllocations];
    }

    // Always enforce house filtering so static files returning all 774 records are filtered correctly
    if (house && house !== 'ALL') {
      const targetHouse = house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha';
      list = list.filter((m) => m.house === targetHouse);
    }
    if (state && state !== 'ALL') {
      list = list.filter((m) => m.state.toLowerCase() === state.toLowerCase());
    }
    if (q) {
      const qLow = q.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.mp_name.toLowerCase().includes(qLow) ||
          m.constituency.toLowerCase().includes(qLow) ||
          m.state.toLowerCase().includes(qLow)
      );
    }
    return list;
  },

  getCalamities: async (house?: 'ALL' | 'LS' | 'RS'): Promise<CalamityConsent[]> => {
    let list: CalamityConsent[] = [];
    try {
      const res = await fetch(`${API_BASE}${withHouse('/calamities', house)}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        list = await res.json();
      }
    } catch {
      // Live backend unreachable - proceed to embedded dataset
    }

    if (!list || list.length === 0) {
      list = [...fallbackCalamities];
    }

    if (house && house !== 'ALL') {
      const targetHouse = house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha';
      return list.filter((c: any) => !c.house || c.house === targetHouse);
    }
    return list;
  },

  getWorks: async (house?: 'ALL' | 'LS' | 'RS', q?: string, mp?: string): Promise<MPLADWork[]> => {
    let records: MPLADWork[] = [];
    try {
      const params = new URLSearchParams();
      if (house && house !== 'ALL') params.append('house', house);
      if (q) params.append('q', q);
      if (mp) params.append('mp', mp);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/works${qs}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        records = await res.json();
      }
    } catch {
      // Live backend unreachable - proceed to embedded dataset
    }

    if (!records || records.length === 0) {
      records = [...fallbackWorks];
    }

    if (house && house !== 'ALL') {
      const targetHouse = house === 'LS' ? 'Lok Sabha' : 'Rajya Sabha';
      const filtered = records.filter((w) => w.house === targetHouse);
      // If sample works dataset doesn't have RS works, keep sample records so works list doesn't crash
      records = filtered.length > 0 ? filtered : records;
    }
    if (mp) {
      const mpLow = mp.trim().toLowerCase();
      records = records.filter(
        (w) =>
          w.mp_name.toLowerCase().includes(mpLow) ||
          mpLow.includes(w.mp_name.toLowerCase())
      );
    }
    if (q) {
      const qLow = q.trim().toLowerCase();
      records = records.filter((w) => JSON.stringify(w).toLowerCase().includes(qLow));
    }
    return records.slice(0, 200);
  },

  getExpenditures: async (): Promise<WorkExpenditure[]> => {
    try {
      const res = await fetch(`${API_BASE}/expenditures`);
      if (res.ok) return await res.json();
    } catch {
      // Live backend unreachable - proceed to embedded dataset
    }
    return fallbackExpenditures;
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
    } catch {
      // Fall through to client-side statutory generation
    }

    const constituencyLabel = mp.constituency || `${mp.state} Statewide`;
    const findingText =
      finding ||
      `Fund utilization is currently at ${mp.utilization_pct}% out of allocated ₹${mp.allocated_cr.toFixed(2)} Cr, triggering a '${mp.risk_badge}' risk band under parliamentary telemetry.`;

    const rti_application = `To,
The Central Public Information Officer (CPIO),
Office of the District Magistrate / Deputy Commissioner,
${constituencyLabel} District, ${mp.state}

Subject: Application for Information under Section 6(1) of the Right to Information Act, 2005

Respected Sir/Madam,

I am a citizen of India and hereby seek the following certified information regarding the administration and ground execution of Members of Parliament Local Area Development Scheme (MPLADS) funds allocated to Hon'ble Member of Parliament ${mp.mp_name} (${mp.house}, ${constituencyLabel}):

1. Certified copy of the official Ledger Statement showing all installments disbursed and unspent balance against the allocated limit of ₹${mp.allocated_cr.toFixed(2)} Crores.
2. Complete register of works recommended by the Hon'ble MP, including:
   a. Date of recommendation.
   b. Administrative sanction date and Sanction Order Number.
   c. Implementing agency designated for each public civil project.
3. List of all works where expenditure has been incurred or funds disbursed, along with names of contractors/executing bodies and respective utilization certificates submitted.
4. Specific reasons and correspondence regarding the recorded fund execution bottleneck (${findingText}).

I hereby state that the information sought relates to public interest and public fund accountability. I am depositing the requisite RTI application fee under Section 6(1).

Applicant Address: Citizen of ${constituencyLabel}, ${mp.state}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
Sincerely,
Citizen Applicant`;

    const first_appeal = `To,
The First Appellate Authority (FAA),
Office of the District Magistrate & District Collector,
${constituencyLabel}, ${mp.state}

Subject: First Appeal under Section 19(1) of the Right to Information Act, 2005

Sir/Madam,

The appellant is aggrieved by the deemed refusal / non-furnishing of mandatory public finance information within the statutory 30-day period prescribed under Section 7(1) of the RTI Act regarding MPLADS fund utilization of MP ${mp.mp_name} (${constituencyLabel}).

GROUNDS OF APPEAL:
1. The CPIO failed to furnish certified statements on the utilization velocity of ₹${mp.allocated_cr.toFixed(2)} Cr public development funds.
2. Under Section 4(1)(b) of the RTI Act, MPLADS project disbursements and sanction registers are suo motu proactive disclosures and cannot be withheld.
3. Evasive pretexts such as 'information being gathered across block offices' have been repeatedly deprecated by the Central Information Commission (CIC).

PRAYER:
The Appellant prays that the First Appellate Authority direct the CPIO to immediately furnish certified copies of all works registers and execution audits without any further delay.

Sincerely,
Appellant`;

    const pil_brief = `PRELIMINARY NOTE FOR COUNSEL // PUBLIC INTEREST LITIGATION (PIL)
IN THE HIGH COURT OF JUDICATURE AT ${mp.state.toUpperCase()} / SUPREME COURT OF INDIA

IN RE: SYSTEMIC OMISSIONS IN MPLADS INFRASTRUCTURE EXECUTION IN ${constituencyLabel.toUpperCase()}
MP: ${mp.mp_name} | ALLOCATED OUTLAY: ₹${mp.allocated_cr.toFixed(2)} CR | REPORTED UTILIZATION: ${mp.utilization_pct}%

SUMMARY OF PUBLIC INTEREST QUESTION:
Under Article 21 of the Constitution of India, the Right to Life encompasses the right to basic public amenities—including motorable rural connectivity, potable water facilities, and public healthcare centers funded through statutory parliamentary allocations.

The official eSAKSHI parliamentary telemetry reveals that despite an allocation limit of ₹${mp.allocated_cr.toFixed(2)} Cr, fund transformation stands severely compromised (${findingText}).

PRAYERS FOR RELIEF:
1. Writ of Mandamus directing the State and District Authorities to conduct a time-bound forensic physical audit of all sanctioned and incomplete works.
2. Directions to ensure immediate geo-tagging and expenditure disclosure on public portals in adherence to Constitutional guarantees of participatory democracy and open governance.`;

    return {
      rti_application,
      first_appeal,
      pil_brief,
    };
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
    } catch {
      // Fall through to client-side budget algorithm
    }

    const total = mp.allocated_cr > 0 ? mp.allocated_cr : 10.0;
    const allocations = [
      {
        category: 'Drinking Water & Sanitation',
        amount_cr: Math.round(total * 0.28 * 100) / 100,
        pct: 28.0,
        justification: `High-priority fundamental amenity: Solar filtration plants and piped rural drinking tap networks in ${mp.constituency || mp.state}.`,
        example_project: 'RO community purification unit and piped school water sanitization grid.',
      },
      {
        category: 'Primary Healthcare & Sub-Centres',
        amount_cr: Math.round(total * 0.24 * 100) / 100,
        pct: 24.0,
        justification: 'Upgrading primary health infrastructure and essential maternal diagnostic equipment at block levels.',
        example_project: 'Maternity triage expansion and solar cold-chain backup for vaccine distribution.',
      },
      {
        category: 'Roads & All-Weather Connectivity',
        amount_cr: Math.round(total * 0.22 * 100) / 100,
        pct: 22.0,
        justification: 'Last-mile arterial link roads connecting agrarian farming hamlets to state market mandis.',
        example_project: 'Concrete box-culvert and flood-resistant link road with solar street illumination.',
      },
      {
        category: 'Education & Digital Infrastructure',
        amount_cr: Math.round(total * 0.16 * 100) / 100,
        pct: 16.0,
        justification: 'Government school smart classrooms, STEM kits, and high-speed broadband public reading rooms.',
        example_project: 'Panchayat digital library and solar rooftop hybrid installation.',
      },
      {
        category: 'Civic Resilience & Disaster Mitigation',
        amount_cr: Math.round(total * 0.1 * 100) / 100,
        pct: 10.0,
        justification: 'Drainage canal desilting and emergency shelters for flood/monsoon protection.',
        example_project: 'Reinforced concrete storm-water drain and community relief shelter.',
      },
    ];

    return {
      mp_name: mp.mp_name,
      constituency: mp.constituency || 'Statewide',
      total_allocated_cr: total,
      allocations,
    };
  },
};

export const crore = (val: number) => `₹${val.toFixed(2)} Cr`;
export const compact = (val: number) => new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(val);

