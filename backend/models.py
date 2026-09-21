from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class MPAllocation(Base):
    __tablename__ = "mp_allocations"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    constituency = Column(String, index=True)
    state = Column(String, index=True)
    house = Column(String) # Lok Sabha / Rajya Sabha
    allocated_cr = Column(Float, default=0.0)
    
class CalamityConsent(Base):
    __tablename__ = "calamity_consents"
    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mp_allocations.id"))
    event_name = Column(String)
    amount_cr = Column(Float)
    date_consented = Column(String)
    
class MPLADWork(Base):
    __tablename__ = "mplad_works"
    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mp_allocations.id"))
    work_name = Column(String)
    sector = Column(String)
    status = Column(String) # RECOMMENDED, SANCTIONED, COMPLETED
    cost_cr = Column(Float)
    
class WorkExpenditure(Base):
    __tablename__ = "work_expenditures"
    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("mplad_works.id"))
    vendor_name = Column(String)
    amount_disbursed = Column(Float)
    date_disbursed = Column(String)
