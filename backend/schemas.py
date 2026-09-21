from pydantic import BaseModel
from typing import List, Optional

class DashboardSummary(BaseModel):
    total_allocated_cr: float
    total_mps: int
    works_recommended: int
    works_sanctioned: int
    works_completed: int
    total_calamity_cr: float
    model_status: str

class MPAllocationSchema(BaseModel):
    id: int
    mp_name: str
    constituency: str
    state: str
    house: str
    allocated_cr: float
    utilization_pct: float
    risk_score: int
    risk_badge: str
    recommended_count: Optional[int] = None
    sanctioned_count: Optional[int] = None
    completed_count: Optional[int] = None
    source_file: Optional[str] = None

class CalamityConsentSchema(BaseModel):
    id: int
    mp_name: str
    constituency: str
    event_name: str
    amount_cr: float
    date_consented: Optional[str] = None
    house: Optional[str] = None
    source_file: Optional[str] = None

class MPLADWorkSchema(BaseModel):
    id: int
    mp_name: str
    work_name: str
    sector: str
    status: str
    cost_cr: float
    house: Optional[str] = None
    constituency: Optional[str] = None
    state: Optional[str] = None
    recommended_date: Optional[str] = None
    sanction_date: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    city: Optional[str] = None
    ida: Optional[str] = None
    ida_approval: Optional[str] = None
    source_file: Optional[str] = None
    source_page: Optional[int] = None

class WorkExpenditureSchema(BaseModel):
    id: int
    work_name: str
    vendor_name: str
    amount_disbursed: float
    date_disbursed: Optional[str] = None
    house: Optional[str] = None
    source_file: Optional[str] = None

class LegalRequest(BaseModel):
    mp_name: str
    constituency: str
    state: str
    house: str
    allocated_cr: float
    utilization_pct: float
    risk_badge: str
    finding: Optional[str] = None

class LegalDocsResponse(BaseModel):
    rti_application: str
    first_appeal: str
    pil_brief: str

class BudgetItem(BaseModel):
    category: str
    amount_cr: float
    pct: float
    justification: str
    example_project: str

class OptimalBudgetResponse(BaseModel):
    mp_name: str
    constituency: str
    total_allocated_cr: float
    allocations: List[BudgetItem]

