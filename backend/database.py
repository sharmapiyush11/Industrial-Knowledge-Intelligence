import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./industrial_brain.db")

# Use connect_args={"check_same_thread": False} only for SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Engineer") # Admin, Plant Manager, Engineer, Technician, Auditor

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, index=True) # e.g. P-101, C-15
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Pump, Compressor, Boiler, Valve, Generator, Piping
    location = Column(String, nullable=False)
    plant = Column(String, nullable=False) # Plant A, Plant B, Plant C
    status = Column(String, default="Operational") # Operational, Critical, Under Maintenance, Offline
    health_score = Column(Float, default=100.0) # 0-100
    failure_prob = Column(Float, default=0.0) # 0.0-1.0
    critical_risk = Column(String, default="Low") # Low, Medium, High, Extreme
    install_date = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    maintenance_logs = relationship("MaintenanceLog", back_populates="asset", cascade="all, delete-orphan")
    inspections = relationship("InspectionReport", back_populates="asset", cascade="all, delete-orphan")
    incidents = relationship("IncidentReport", back_populates="asset", cascade="all, delete-orphan")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    activity = Column(Text, nullable=False)
    cost = Column(Float, default=0.0)
    duration_hours = Column(Float, default=0.0)
    technician = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Completed") # Scheduled, In Progress, Completed, Failed

    asset = relationship("Asset", back_populates="maintenance_logs")

class SOP(Base):
    __tablename__ = "sops"
    id = Column(String, primary_key=True, index=True) # SOP-001, etc.
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False) # Maintenance, Safety, Operations, Compliance
    version = Column(String, default="1.0")
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    file_path = Column(String, nullable=True)

class InspectionReport(Base):
    __tablename__ = "inspection_reports"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    inspector = Column(String, nullable=False)
    findings = Column(Text, nullable=False)
    score = Column(Float, default=100.0) # 0-100
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Pass") # Pass, Fail, Flagged
    cert_expiry = Column(DateTime, nullable=True)

    asset = relationship("Asset", back_populates="inspections")

class IncidentReport(Base):
    __tablename__ = "incident_reports"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    severity = Column(String, default="Medium") # Low, Medium, High, Critical
    root_cause = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    reporter = Column(String, nullable=False)

    asset = relationship("Asset", back_populates="incidents")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="Pending") # Pending, In Progress, Completed
    assignee = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    entity_type = Column(String, nullable=False) # asset, document, task, compliance
    entity_id = Column(String, nullable=False) # ID of target entity
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
