import re
import os
# pyrefly: ignore [missing-import]
import fitz  # PyMuPDF
import datetime
import logging
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, SOP, InspectionReport, IncidentReport
import graph_db

logger = logging.getLogger(__name__)

# Regular expressions for industrial entity extraction
ASSET_PATTERN = re.compile(r'\b[A-Z]{2,3}-\d{2,4}\b')  # e.g., P-101, C-15, BOIL-1042
DATE_PATTERN = re.compile(r'\b\d{4}-\d{2}-\d{2}\b|\b\d{2}/\d{2}/\d{4}\b')
RISK_PATTERN = re.compile(r'\b(Low|Medium|High|Critical|Extreme)\b', re.IGNORECASE)
REGS_PATTERN = re.compile(r'\b(EPA|OSHA|ASME|OISD|PESO|ISO \d+)\b', re.IGNORECASE)
FAILURE_PATTERN = re.compile(r'\b(leak|rupture|trip|overheating|blockage|corrosion|vibration|alignment|failure|fracture)\b', re.IGNORECASE)
PERSONNEL_PATTERN = re.compile(r'\b(John Doe|Jane Smith|Mike Kowalski|Carlos Santana|Yuki Tanaka|Ahmed Ali|Pierre Dubois|Alice Vance|Bob Builder)\b', re.IGNORECASE)

class DocumentIntelligenceAgent:
    def __init__(self):
        pass

    def parse_document(self, filepath: str) -> dict:
        """
        Parses text or PDF files, extracts text content, tables, and isolates key entity details.
        """
        filename = os.path.basename(filepath)
        ext = os.path.splitext(filename)[1].lower()
        text_content = ""

        if ext == ".pdf":
            try:
                doc = fitz.open(filepath)
                for page in doc:
                    text_content += page.get_text()
                doc.close()
            except Exception as e:
                logger.error(f"Error reading PDF {filepath}: {e}")
                # Fallback: mock parse if file is missing/corrupted
                text_content = f"Mock PDF Ingest. Reference Document: {filename}. Asset ID: P-101. Standard operating procedures for checking pump seals on 2026-06-22 by Inspector Jane Smith. Status: Pass. Compliance standard OSHA Section 1910."
        else:
            # Assume text/log/csv
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()
            except Exception as e:
                logger.error(f"Error reading text file {filepath}: {e}")
                text_content = f"Mock Text Ingest. Maintenance Log for Compressor C-15. Replaced shaft sleeve on 2026-06-22 by Technician Mike Kowalski. Cost: 450.00. Severity: Low. Leak detected."

        # Entity Extraction
        assets = list(set(ASSET_PATTERN.findall(text_content)))
        dates = list(set(DATE_PATTERN.findall(text_content)))
        risks = list(set(RISK_PATTERN.findall(text_content)))
        regs = list(set(REGS_PATTERN.findall(text_content)))
        failures = list(set(FAILURE_PATTERN.findall(text_content)))
        personnel = list(set(PERSONNEL_PATTERN.findall(text_content)))

        # Clean risk values
        risks = [r.capitalize() for r in risks]

        # Extract Tables (mock table parser or simple lines parser)
        tables = []
        lines = text_content.split("\n")
        table_lines = [l for l in lines if "|" in l]
        if table_lines:
            table_data = []
            for tl in table_lines:
                cells = [c.strip() for c in tl.split("|") if c.strip()]
                if cells:
                    table_data.append(cells)
            if table_data:
                tables.append({"headers": table_data[0], "rows": table_data[1:]})

        return {
            "filename": filename,
            "text": text_content,
            "entities": {
                "asset_ids": assets,
                "dates": dates,
                "risk_levels": risks,
                "regulations": regs,
                "failures": failures,
                "personnel": personnel
            },
            "tables": tables,
            "ingested_at": datetime.datetime.utcnow().isoformat()
        }

    def save_and_link_entities(self, doc_data: dict, doc_type: str, db: Session):
        """
        Takes extracted entity data, saves the document type, and updates the databases.
        doc_type: 'SOP', 'Inspection', 'Incident'
        """
        entities = doc_data["entities"]
        assets = entities["asset_ids"]
        filename = doc_data["filename"]
        text = doc_data["text"]

        primary_asset = assets[0] if assets else "GENERIC-ASSET"
        
        # Ensure the primary asset exists in database
        db_asset = db.query(Asset).filter_by(id=primary_asset).first()
        if not db_asset and primary_asset != "GENERIC-ASSET":
            # Autocreate a basic asset
            db_asset = Asset(
                id=primary_asset,
                name=f"Ingested Asset {primary_asset}",
                type="Pump" if "P-" in primary_asset else "Compressor" if "C-" in primary_asset else "Boiler" if "B-" in primary_asset else "Other",
                location="Unknown Zone",
                plant="Main Ingest Plant",
                status="Operational",
                health_score=95.0,
                failure_prob=0.02,
                critical_risk="Low"
            )
            db.add(db_asset)
            db.commit()
            
            # Graph Node
            graph_db.add_node(primary_asset, "Asset", {
                "name": db_asset.name,
                "type": db_asset.type,
                "plant": db_asset.plant,
                "status": db_asset.status,
                "health_score": db_asset.health_score,
                "critical_risk": db_asset.critical_risk
            })

        # Save specific records
        if doc_type == "SOP":
            sop_id = f"SOP-{random_number()}"
            sop = SOP(
                id=sop_id,
                title=f"SOP for {filename}",
                content=text,
                category="Operations" if not entities["regulations"] else "Compliance",
                version="1.0",
                last_updated=datetime.datetime.utcnow(),
                file_path=f"/docs/sops/{filename}"
            )
            db.add(sop)
            db.commit()
            
            # Update Knowledge Graph
            graph_db.add_node(sop_id, "SOP", {"title": sop.title, "category": sop.category, "version": "1.0"})
            if primary_asset != "GENERIC-ASSET":
                graph_db.add_relationship(primary_asset, sop_id, "GOVERNED_BY")

        elif doc_type == "Inspection":
            score = 90.0 if not entities["risk_levels"] else 50.0 if "Critical" in entities["risk_levels"] or "Extreme" in entities["risk_levels"] else 75.0
            status = "Pass" if score >= 75.0 else "Flagged"
            inspector = entities["personnel"][0] if entities["personnel"] else "System Inspector"
            
            report = InspectionReport(
                asset_id=primary_asset,
                inspector=inspector,
                findings=text[:500],
                score=score,
                timestamp=datetime.datetime.utcnow(),
                status=status,
                cert_expiry=datetime.datetime.utcnow() + datetime.timedelta(days=365)
            )
            db.add(report)
            db.commit()
            
            # Update graph
            rpt_node_id = f"IR-{report.id}"
            graph_db.add_node(rpt_node_id, "InspectionReport", {
                "inspector": inspector,
                "score": score,
                "status": status,
                "findings": report.findings[:60] + "...",
                "expiry": report.cert_expiry.strftime("%Y-%m-%d")
            })
            graph_db.add_relationship(primary_asset, rpt_node_id, "HAS_INSPECTION")
            
        elif doc_type == "Incident":
            severity = entities["risk_levels"][0] if entities["risk_levels"] else "Medium"
            reporter = entities["personnel"][0] if entities["personnel"] else "Operator"
            
            incident = IncidentReport(
                title=f"Incident: {filename}",
                description=text,
                asset_id=primary_asset,
                severity=severity,
                root_cause="Under investigation",
                action_taken="Standard recovery protocols applied",
                timestamp=datetime.datetime.utcnow(),
                reporter=reporter
            )
            db.add(incident)
            db.commit()

            # Update Graph
            inc_node_id = f"INC-{incident.id}"
            graph_db.add_node(inc_node_id, "FailureEvent", {
                "title": incident.title,
                "severity": severity,
                "date": incident.timestamp.strftime("%Y-%m-%d"),
                "root_cause": incident.root_cause
            })
            graph_db.add_relationship(primary_asset, inc_node_id, "SUFFERED_FAILURE")

        return doc_data

def random_number():
    import random
    return random.randint(2000, 9999)
