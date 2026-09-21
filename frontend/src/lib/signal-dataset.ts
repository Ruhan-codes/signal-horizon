import type { DashboardSummary, MPAllocation, CalamityConsent, MPLADWork, WorkExpenditure } from './signal-types';

export const fallbackSummary: DashboardSummary = {
  total_allocated_cr: 11676.79,
  total_mps: 774,
  works_recommended: 127420,
  works_sanctioned: 54203,
  works_completed: 43725,
  total_calamity_cr: 14.51,
  model_status: "DATA-DERIVED RISK BANDS"
};

export const fallbackAllocations: MPAllocation[] = [
  { id: 1, mp_name: "Rahul Gandhi", constituency: "Wayanad / Rae Bareli", state: "Kerala", house: "Lok Sabha", allocated_cr: 17.0, utilization_pct: 78.4, risk_score: 22, risk_badge: "Low", recommended_count: 142, sanctioned_count: 85, completed_count: 51 },
  { id: 2, mp_name: "Narendra Modi", constituency: "Varanasi", state: "Uttar Pradesh", house: "Lok Sabha", allocated_cr: 17.0, utilization_pct: 92.1, risk_score: 8, risk_badge: "Low", recommended_count: 210, sanctioned_count: 180, completed_count: 144 }
];

export const fallbackCalamities: CalamityConsent[] = [
  { id: 1, mp_name: "Rahul Gandhi", constituency: "Wayanad", event_name: "Wayanad Landslides 2024", amount_cr: 2.5, date_consented: "2024-08-15" }
];

export const fallbackWorks: MPLADWork[] = [];
export const fallbackExpenditures: WorkExpenditure[] = [];
