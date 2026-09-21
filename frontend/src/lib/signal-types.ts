export interface DashboardSummary {
  total_allocated_cr: number;
  total_mps: number;
  works_recommended: number;
  works_sanctioned: number;
  works_completed: number;
  total_calamity_cr: number;
  model_status: string;
}

export interface MPAllocation {
  id: number;
  mp_name: string;
  constituency: string;
  state: string;
  house: string;
  allocated_cr: number;
  utilization_pct: number;
  risk_score: number;
  risk_badge: string;
  recommended_count?: number;
  sanctioned_count?: number;
  completed_count?: number;
  source_file?: string;
}

export interface CalamityConsent {
  id: number;
  mp_name: string;
  constituency: string;
  event_name: string;
  amount_cr: number;
  date_consented: string;
}

export interface MPLADWork {
  id: number;
  mp_name: string;
  work_name: string;
  sector: string;
  status: string;
  cost_cr: number;
  house?: string;
  constituency?: string;
  state?: string;
  recommended_date?: string;
  village?: string;
  block?: string;
  city?: string;
  ida?: string;
  ida_approval?: string;
  source_file?: string;
}

export interface WorkExpenditure {
  id: number;
  work_name: string;
  vendor_name: string;
  amount_disbursed: number;
  date_disbursed: string;
}

export interface LegalDocsResponse {
  rti_application: string;
  first_appeal: string;
  pil_brief: string;
}

export interface BudgetItem {
  category: string;
  amount_cr: number;
  pct: number;
  justification: string;
  example_project: string;
}

export interface OptimalBudgetResponse {
  mp_name: string;
  constituency: string;
  total_allocated_cr: number;
  allocations: BudgetItem[];
}

export function riskBand(score: number): 'Low' | 'Medium' | 'Review Required' {
  if (score < 25) return 'Low';
  if (score < 45) return 'Medium';
  return 'Review Required';
}
