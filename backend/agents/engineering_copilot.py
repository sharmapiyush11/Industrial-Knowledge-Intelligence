import re
import logging
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, MaintenanceLog, SOP, IncidentReport, InspectionReport
import os

logger = logging.getLogger(__name__)

class EngineeringCopilotAgent:
    def __init__(self):
        pass

    def answer_question(self, query: str, db: Session) -> dict:
        """
        Answers industrial queries using local database information, logic, and generates source citations,
        confidence scores, related assets/documents, and suggested follow-up questions.
        """
        query_lower = query.lower()
        
        # 1. Identify assets mentioned in the query
        # Pattern: prefix like P-101, C-15, B-12
        assets_found = list(set(re.findall(r'\b[a-zA-Z]{2,3}-\d{2,4}\b', query)))
        # Capitalize them
        assets_found = [a.upper() for a in assets_found]

        # Initialize answer container
        response_text = ""
        citations = []
        related_assets = []
        related_docs = []
        confidence_score = 0.90
        suggested_questions = []

        # If specific assets are found, fetch them
        db_assets = []
        for aid in assets_found:
            asset = db.query(Asset).filter_by(id=aid).first()
            if asset:
                db_assets.append(asset)
                related_assets.append({"id": asset.id, "name": asset.name, "status": asset.status, "health": asset.health_score})

        # Answer based on query keywords
        # --- KEYWORD: MAINTENANCE / ACTIVITY / WORK ---
        if "maintenance" in query_lower or "activity" in query_lower or "activities" in query_lower or "work" in query_lower:
            confidence_score = 0.95
            if db_assets:
                for asset in db_assets:
                    logs = db.query(MaintenanceLog).filter_by(asset_id=asset.id).order_by(MaintenanceLog.timestamp.desc()).limit(5).all()
                    if logs:
                        response_text += f"### Maintenance Record for {asset.name} ({asset.id})\n"
                        response_text += f"The asset is currently **{asset.status}** with a Health Score of **{asset.health_score}%**.\n"
                        response_text += f"Here are the recent maintenance records found:\n\n"
                        for idx, log in enumerate(logs):
                            date_str = log.timestamp.strftime("%Y-%m-%d")
                            response_text += f"- **{date_str}** | Tech: *{log.technician}* | Status: `{log.status}` | Cost: ${log.cost:.2f}\n  *Activity*: {log.activity}\n"
                            # Add citation
                            citations.append({
                                "source": f"Maintenance Log Record ML-{log.id}",
                                "url": f"/api/documents/maintenance/{log.id}",
                                "snippet": f"{log.technician} completed {log.activity} on {date_str} costing ${log.cost:.2f}."
                            })
                    else:
                        response_text += f"No maintenance logs found for asset {asset.id}.\n"
                
                suggested_questions = [
                    f"What is the predicted failure probability of {assets_found[0]}?",
                    f"Show compliance status for {assets_found[0]}."
                ]
            else:
                # General maintenance logs
                recent_logs = db.query(MaintenanceLog).order_by(MaintenanceLog.timestamp.desc()).limit(5).all()
                response_text = "### Global Maintenance Records\nNo specific Asset ID was parsed from your question. Here are the 5 most recent activities across all assets:\n\n"
                for log in recent_logs:
                    response_text += f"- **Asset {log.asset_id}** | {log.timestamp.strftime('%Y-%m-%d')} | Tech: {log.technician} | Activity: *{log.activity}* ({log.status})\n"
                    citations.append({
                        "source": f"Log ML-{log.id}",
                        "url": f"/api/documents/maintenance/{log.id}",
                        "snippet": log.activity
                    })
                suggested_questions = [
                    "What maintenance activities occurred on Pump P-101 in the last year?",
                    "Which assets are repeatedly failing?"
                ]

        # --- KEYWORD: FAILURE / FAILING / BREAKDOWN ---
        elif "fail" in query_lower or "failure" in query_lower or "failing" in query_lower or "broken" in query_lower:
            confidence_score = 0.93
            if db_assets:
                for asset in db_assets:
                    incidents = db.query(IncidentReport).filter_by(asset_id=asset.id).order_by(IncidentReport.timestamp.desc()).all()
                    if incidents:
                        response_text += f"### Incident Records for {asset.name} ({asset.id})\n"
                        response_text += f"There are **{len(incidents)}** recorded failures/incidents for this asset:\n\n"
                        for inc in incidents:
                            date_str = inc.timestamp.strftime("%Y-%m-%d")
                            response_text += f"- **{date_str}** | Severity: **{inc.severity}** | Reporter: {inc.reporter}\n"
                            response_text += f"  *Description*: {inc.description}\n"
                            response_text += f"  *Root Cause*: {inc.root_cause or 'Pending'}\n"
                            response_text += f"  *Action Taken*: {inc.action_taken or 'N/A'}\n\n"
                            citations.append({
                                "source": f"Incident Report INC-{inc.id}",
                                "url": f"/api/documents/incidents/{inc.id}",
                                "snippet": f"{inc.title} on {date_str}. Root Cause: {inc.root_cause}."
                            })
                    else:
                        response_text += f"No critical failure incident records were found in the database for asset **{asset.id}**.\n"
                
                suggested_questions = [
                    f"Is there an SOP procedure for repairing {assets_found[0]}?",
                    f"Show latest inspection findings for {assets_found[0]}."
                ]
            else:
                # Assets failing repeatedly
                repeated = db.query(Asset).filter(Asset.status.in_(["Critical", "Offline"])).order_by(Asset.health_score.asc()).limit(5).all()
                response_text = "### Assets with High Risk or Low Health\n"
                response_text += "Based on database metrics, here are the assets experiencing critical failures or lowest health scores:\n\n"
                for asset in repeated:
                    response_text += f"- **{asset.id}** ({asset.name}) | Status: `{asset.status}` | Health: **{asset.health_score}%** | Failure Prob: **{asset.failure_prob*100:.1f}%**\n"
                    # Query latest incident
                    last_inc = db.query(IncidentReport).filter_by(asset_id=asset.id).order_by(IncidentReport.timestamp.desc()).first()
                    if last_inc:
                        response_text += f"  *Last Failure ({last_inc.timestamp.strftime('%Y-%m-%d')})*: {last_inc.title} - {last_inc.root_cause}\n"
                        citations.append({
                            "source": f"Incident Report INC-{last_inc.id}",
                            "url": f"/api/documents/incidents/{last_inc.id}",
                            "snippet": last_inc.title
                        })
                suggested_questions = [
                    "What failure occurred on Compressor C-105?",
                    "Analyze root causes of Boiler failures."
                ]

        # --- KEYWORD: SOP / PROCEDURE / INSTRUCTION ---
        elif "sop" in query_lower or "procedure" in query_lower or "instruction" in query_lower:
            confidence_score = 0.96
            # Query SOPs matching category or keywords
            sops = []
            if db_assets:
                # Find SOPs linked to the category of the assets found
                for asset in db_assets:
                    cat = "Maintenance" if asset.status in ["Under Maintenance", "Critical"] else "Operations"
                    sops = db.query(SOP).filter(SOP.content.like(f"%{asset.type}%")).limit(3).all()
                    
                    if sops:
                        response_text += f"### Operating Procedures (SOPs) matching {asset.type} ({asset.id})\n\n"
                        for sop in sops:
                            response_text += f"- **{sop.id}: {sop.title}** (Rev {sop.version})\n  *Summary*: {sop.content.split('3. DETAILED PROCEDURAL STEPS')[0]}\n"
                            related_docs.append({"id": sop.id, "title": sop.title, "category": sop.category, "url": sop.file_path})
                            citations.append({
                                "source": f"SOP File: {sop.id}",
                                "url": f"/api/documents/sops/{sop.id}",
                                "snippet": sop.title
                            })
                    else:
                        response_text += f"No specific SOP found mapping directly to asset **{asset.id}** ({asset.type}).\n"
            
            if not sops:
                # Show general SOPs
                sops = db.query(SOP).order_by(SOP.id.asc()).limit(5).all()
                response_text = "### Available Standard Operating Procedures (SOPs)\nHere are some core engineering procedures found:\n\n"
                for sop in sops:
                    response_text += f"- **{sop.id}: {sop.title}** (Category: `{sop.category}`)\n"
                    citations.append({
                        "source": f"SOP {sop.id}",
                        "url": f"/api/documents/sops/{sop.id}",
                        "snippet": sop.title
                    })
            suggested_questions = [
                "Which SOP applies to Boiler B-103?",
                "Show EPA emissions compliance SOP."
            ]

        # --- KEYWORD: COMPLIANCE / REGULATION / AUDIT ---
        elif "comply" in query_lower or "compliance" in query_lower or "regulation" in query_lower or "audit" in query_lower:
            confidence_score = 0.94
            # Search compliance findings
            failed_inspections = db.query(InspectionReport).filter(InspectionReport.status.in_(["Fail", "Flagged"])).limit(5).all()
            response_text = "### Compliance & Inspection Assessment\n"
            if failed_inspections:
                response_text += f"Found **{len(failed_inspections)}** assets with failed/flagged inspections that compromise compliance:\n\n"
                for ins in failed_inspections:
                    response_text += f"- **Asset {ins.asset_id}** | Inspector: {ins.inspector} | Score: **{ins.score}%**\n  *Findings*: {ins.findings}\n  *Certificate Expiry*: {ins.cert_expiry.strftime('%Y-%m-%d') if ins.cert_expiry else 'Expired'}\n\n"
                    citations.append({
                        "source": f"Inspection Report IR-{ins.id}",
                        "url": f"/api/documents/inspections/{ins.id}",
                        "snippet": ins.findings
                    })
            else:
                response_text += "All assets are currently passing safety and regulatory inspection marks. Ready for audit.\n"

            suggested_questions = [
                "Generate an audit readiness score for Houston Refinery.",
                "List all expired inspections."
            ]

        # --- DEFAULT FALLBACK / INTENT UNKNOWN ---
        else:
            confidence_score = 0.82
            response_text = f"### Engineering Intelligence Assistant\n\nI processed your query: *\"{query}\"*\n\n"
            if db_assets:
                for asset in db_assets:
                    response_text += f"- **Asset ID {asset.id}**: {asset.name} is installed at {asset.location} ({asset.plant}). Its health score is **{asset.health_score}%** and status is **{asset.status}**.\n"
                suggested_questions = [
                    f"Show maintenance records for {assets_found[0]}.",
                    f"Show failures related to {assets_found[0]}."
                ]
            else:
                response_text += "I'm the Industrial Operations Brain. Ask me questions about asset maintenance logs, equipment failure events, standard operating procedures (SOPs), or compliance status.\n\n"
                response_text += "Try queries like:\n"
                response_text += "1. *\"What maintenance activities occurred on Pump P-101 in the last year?\"*\n"
                response_text += "2. *\"Show all failures related to Compressor C-15.\"*\n"
                response_text += "3. *\"Which SOP applies to Boiler B-102?\"*"
                
                suggested_questions = [
                    "What maintenance activities occurred on Pump P-101 in the last year?",
                    "Which assets are repeatedly failing?"
                ]

        return {
            "query": query,
            "answer": response_text,
            "confidence_score": round(confidence_score, 2),
            "citations": citations,
            "related_assets": related_assets,
            "related_documents": related_docs,
            "suggested_questions": suggested_questions
        }
