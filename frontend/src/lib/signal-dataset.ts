import type { DashboardSummary, MPAllocation, CalamityConsent, MPLADWork, WorkExpenditure } from './signal-types';
import rawSummary from '../data/summary.json';
import rawSummaryLS from '../data/summary_ls.json';
import rawSummaryRS from '../data/summary_rs.json';
import rawAllocations from '../data/allocations.json';
import rawCalamities from '../data/calamities.json';
import rawWorks from '../data/works.json';
import rawExpenditures from '../data/expenditures.json';

export const fallbackSummary: DashboardSummary = rawSummary as DashboardSummary;
export const fallbackSummaryLS: DashboardSummary = rawSummaryLS as DashboardSummary;
export const fallbackSummaryRS: DashboardSummary = rawSummaryRS as DashboardSummary;
export const fallbackAllocations: MPAllocation[] = rawAllocations as MPAllocation[];
export const fallbackCalamities: CalamityConsent[] = rawCalamities as CalamityConsent[];
export const fallbackWorks: MPLADWork[] = rawWorks as MPLADWork[];
export const fallbackExpenditures: WorkExpenditure[] = rawExpenditures as WorkExpenditure[];

