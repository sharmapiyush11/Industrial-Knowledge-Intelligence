import os
import shutil
import asyncio
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import datetime

# Import database, seeding, and agent classes
from database import init_db, get_db, Asset, MaintenanceLog, SOP, InspectionReport, IncidentReport, User, Task, Comment
from utils import seed_data
import graph_db
from agents.doc_intel import DocumentIntelligenceAgent
from agents.knowledge_graph import KnowledgeGraphAgent
from agents.engineering_copilot import EngineeringCopilotAgent
from agents.predictive_maintenance import PredictiveMaintenanceAgent
from agents.compliance import ComplianceIntelligenceAgent
from agents.root_cause import RootCauseAnalysisAgent
from agents.lessons_learned import LessonsLearnedAgent

# Init FastAPI app
app = FastAPI(
    title="Industrial Brain AI API",
    description="Unified Asset & Operations Knowledge Intelligence Platform Backend",
    version="1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent singletons
doc_agent = DocumentIntelligenceAgent()
kg_agent = KnowledgeGraphAgent()
copilot_agent = EngineeringCopilotAgent()
pm_agent = PredictiveMaintenanceAgent()
compliance_agent = ComplianceIntelligenceAgent()
rca_agent = RootCauseAnalysisAgent()
lessons_agent = LessonsLearnedAgent()

# WebSocket Alert Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Pydantic Schemas for validation
class LoginRequest(BaseModel):
    username: str
    password: str

class AskRequest(BaseModel):
    question: str

class RcaRequest(BaseModel):
    title: str
    description: str
    asset_id: str

class CommentCreate(BaseModel):
    text: str
    author: str
    entity_type: str
    entity_id: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee: Optional[str] = None

# Startup Event: init db, seed if empty, train model
@app.on_event("startup")
def startup_event():
    logger = app.state.logger if hasattr(app.state, 'logger') else None
    print("Starting Industrial Brain AI Backend...")
    # Initialize DB schemas
    init_db()
    
    # Auto seed database if empty
    db = next(get_db())
    try:
        seed_data.seed_db_data(db)
        # Re-sync graph relationships on startup
        kg_agent.sync_graph_from_database(db)
        # Train Predictive model on seeded data
        pm_agent.train_model(db)
        pm_agent.update_all_asset_scores(db)
    except Exception as e:
        print(f"Error during startup seeding/training: {e}")
    finally:
        db.close()

# WebSocket endpoint
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection success message
        await websocket.send_json({
            "type": "SYSTEM",
            "message": "Connected to Industrial Brain real-time alarm stream.",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ----------------- AUTHENTICATION -----------------
@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=req.username).first()
    if not user:
         raise HTTPException(status_code=400, detail="Invalid username or password")
    
    import hashlib
    req_hash = hashlib.sha256(req.password.encode("utf-8")).hexdigest()
    if user.password_hash != req_hash:
         raise HTTPException(status_code=400, detail="Invalid username or password")
         
    return {
        "access_token": "mock-token-session-id",
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "email": user.email
    }

@app.post("/api/auth/signup")
def signup(username: str = Form(...), email: str = Form(...), password: str = Form(...), role: str = Form("Engineer"), db: Session = Depends(get_db)):
    exists = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
    
    import hashlib
    password_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    
    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        role=role
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "message": f"User {username} registered successfully."}

# ----------------- EXECUTIVE DASHBOARD & ASSETS -----------------
@app.get("/api/dashboard/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    offline_assets = db.query(Asset).filter(Asset.status.in_(["Offline", "Critical"])).count()
    
    # Calculate health average
    avg_health = db.query(Asset).with_entities(Asset.health_score).all()
    avg_health_val = sum(h[0] for h in avg_health) / total_assets if total_assets > 0 else 100.0
    
    # Inspections count
    inspections_count = db.query(InspectionReport).count()
    
    # Active failures count
    incidents_count = db.query(IncidentReport).count()
    
    # Compliance check
    audit_results = compliance_agent.run_compliance_audit(db)
    
    return {
        "asset_health_score": round(avg_health_val, 1),
        "compliance_score": audit_results["compliance_score"],
        "open_risks": incidents_count,
        "failure_predictions": offline_assets,
        "documents_indexed": db.query(SOP).count() + inspections_count + incidents_count
    }

@app.get("/api/assets")
def list_assets(plant: Optional[str] = None, status: Optional[str] = None, type: Optional[str] = None, risk: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Asset)
    if plant:
        query = query.filter_by(plant=plant)
    if status:
        query = query.filter_by(status=status)
    if type:
        query = query.filter_by(type=type)
    if risk:
        query = query.filter_by(critical_risk=risk)
        
    assets = query.order_by(Asset.health_score.asc()).all()
    return assets

@app.get("/api/assets/{asset_id}")
def get_asset_details(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter_by(id=asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Get timelines
    logs = db.query(MaintenanceLog).filter_by(asset_id=asset_id).order_by(MaintenanceLog.timestamp.desc()).limit(15).all()
    failures = db.query(IncidentReport).filter_by(asset_id=asset_id).order_by(IncidentReport.timestamp.desc()).all()
    inspections = db.query(InspectionReport).filter_by(asset_id=asset_id).order_by(InspectionReport.timestamp.desc()).all()
    
    # Get predictive maintenance recommendations
    pred = pm_agent.predict_asset_risk(asset_id, db)
    
    return {
        "asset": asset,
        "maintenance_timeline": logs,
        "failure_timeline": failures,
        "inspection_timeline": inspections,
        "predictive_analysis": pred
    }

# ----------------- ENGINEERING COPILOT -----------------
@app.post("/api/copilot/ask")
def copilot_ask(req: AskRequest, db: Session = Depends(get_db)):
    res = copilot_agent.answer_question(req.question, db)
    return res

@app.post("/api/predictive/run-batch")
async def run_predictive_batch(db: Session = Depends(get_db)):
    pm_agent.train_model(db)
    pm_agent.update_all_asset_scores(db)
    # Broadcast alert
    await manager.broadcast({
        "type": "RISK_ALERT",
        "message": "Predictive maintenance batch score updates complete. Real-time Asset Health updated.",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "success", "message": "Batch predictions complete"}

# ----------------- COMPLIANCE -----------------
@app.get("/api/compliance/audit")
def compliance_audit(db: Session = Depends(get_db)):
    res = compliance_agent.run_compliance_audit(db)
    return res

# ----------------- ROOT CAUSE ANALYSIS -----------------
@app.post("/api/rca/analyze")
def rca_analyze(req: RcaRequest, db: Session = Depends(get_db)):
    res = rca_agent.analyze_incident(req.title, req.description, req.asset_id, db)
    return res

# ----------------- LESSONS LEARNED -----------------
@app.get("/api/lessons-learned/analyze")
def lessons_learned_analyze(db: Session = Depends(get_db)):
    res = lessons_agent.extract_lessons_and_patterns(db)
    return res

# ----------------- KNOWLEDGE GRAPH -----------------
@app.get("/api/graph/data")
def graph_data():
    return graph_db.get_graph_data()

@app.post("/api/graph/sync")
def graph_sync(db: Session = Depends(get_db)):
    res = kg_agent.sync_graph_from_database(db)
    return res

# ----------------- DOCUMENT MANAGEMENT -----------------
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),  # SOP, Inspection, Incident
    db: Session = Depends(get_db)
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run Document Parsing OCR
        doc_data = doc_agent.parse_document(file_path)
        # Save records & link entities
        doc_agent.save_and_link_entities(doc_data, doc_type, db)
        # Sync graph
        kg_agent.sync_graph_from_database(db)
        
        # Broadcast alert to all clients
        await manager.broadcast({
            "type": "DOCUMENT_INDEXED",
            "message": f"Successfully ingested {file.filename} as {doc_type}. Entities linked in Knowledge Graph.",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        
        return {
            "status": "success",
            "filename": file.filename,
            "parsed_entities": doc_data["entities"],
            "tables_found": len(doc_data["tables"])
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Parsing error: {e}")

@app.get("/api/documents/list")
def list_documents(db: Session = Depends(get_db)):
    # Group SOPs, Inspections, and Incidents into document views
    sops = db.query(SOP).all()
    inspections = db.query(InspectionReport).all()
    incidents = db.query(IncidentReport).all()
    
    docs = []
    for s in sops:
        docs.append({
            "id": s.id,
            "title": s.title,
            "type": "SOP",
            "category": s.category,
            "date": s.last_updated.strftime("%Y-%m-%d"),
            "file_path": s.file_path or f"/api/documents/view/sop/{s.id}"
        })
    for i in inspections:
        docs.append({
            "id": f"IR-{i.id}",
            "title": f"Inspection Report: {i.asset_id} by {i.inspector}",
            "type": "Inspection",
            "category": i.status,
            "date": i.timestamp.strftime("%Y-%m-%d"),
            "file_path": f"/api/documents/view/inspection/{i.id}"
        })
    for inc in incidents:
        docs.append({
            "id": f"INC-{inc.id}",
            "title": inc.title,
            "type": "Incident",
            "category": inc.severity,
            "date": inc.timestamp.strftime("%Y-%m-%d"),
            "file_path": f"/api/documents/view/incident/{inc.id}"
        })
    return docs

# ----------------- DEMO SEED FOR JUDGES -----------------
@app.post("/api/demo/seed")
async def demo_seed(db: Session = Depends(get_db)):
    db.query(MaintenanceLog).delete()
    db.query(InspectionReport).delete()
    db.query(IncidentReport).delete()
    db.query(SOP).delete()
    db.query(Asset).delete()
    db.query(User).delete()
    db.commit()
    
    seed_data.seed_db_data(db)
    kg_agent.sync_graph_from_database(db)
    pm_agent.train_model(db)
    pm_agent.update_all_asset_scores(db)
    
    # Broadcast alerts
    await manager.broadcast({
        "type": "SYSTEM",
        "message": "Demo database successfully re-seeded by Judge request.",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    
    return {"status": "success", "message": "Demo data successfully seeded"}

# ----------------- COLLABORATION FEATURES -----------------
@app.post("/api/collaboration/comment")
def add_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    new_comment = Comment(
        text=comment.text,
        author=comment.author,
        entity_type=comment.entity_type,
        entity_id=comment.entity_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_comment)
    db.commit()
    return {"status": "success", "comment": new_comment}

@app.get("/api/collaboration/comments/{entity_type}/{entity_id}")
def get_comments(entity_type: str, entity_id: str, db: Session = Depends(get_db)):
    return db.query(Comment).filter_by(entity_type=entity_type, entity_id=entity_id).order_by(Comment.created_at.desc()).all()

@app.post("/api/collaboration/task")
def add_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description,
        assignee=task.assignee,
        status="Pending",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_task)
    db.commit()
    return {"status": "success", "task": new_task}

@app.get("/api/collaboration/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.created_at.desc()).all()
