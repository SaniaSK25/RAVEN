from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean
from sqlalchemy.orm import 
from app.core.database import Base

class Requirement(Base):
    __tablename__ = "requirements"
    id: int
    requirement_no: str
    title: str
    gamp_category: str 
    gamp_rationale: str
    gxp_impact: str
    gxp_rationale: str
    version: str
    is_stale: str
    created_at: 
    updated_at
