import logging
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, SOP, InspectionReport, IncidentReport, MaintenanceLog
import graph_db

logger = logging.getLogger(__name__)

class KnowledgeGraphAgent:
    def __init__(self):
        pass

    def sync_graph_from_database(self, db: Session):
        """
        Scans all database records and rebuilds the Knowledge Graph nodes and edges.
        """
        logger.info("Synchronizing Knowledge Graph with Database records...")
        graph_db.clear_graph()

        # 1. Fetch and add assets
        assets = db.query(Asset).all()
        for asset in assets:
            graph_db.add_node(asset.id, "Asset", {
                "name": asset.name,
                "type": asset.type,
                "plant": asset.plant,
                "status": asset.status,
                "health_score": asset.health_score,
                "critical_risk": asset.critical_risk
            }, save=False)

        # 2. Fetch and add SOPs
        sops = db.query(SOP).all()
        for sop in sops:
            graph_db.add_node(sop.id, "SOP", {
                "title": sop.title,
                "category": sop.category,
                "version": sop.version
            }, save=False)

        # 3. Fetch and add Inspections
        inspections = db.query(InspectionReport).all()
        for ins in inspections:
            node_id = f"IR-{ins.id}"
            graph_db.add_node(node_id, "InspectionReport", {
                "inspector": ins.inspector,
                "score": ins.score,
                "status": ins.status,
                "findings": ins.findings[:60] + "...",
                "expiry": ins.cert_expiry.strftime("%Y-%m-%d") if ins.cert_expiry else "N/A"
            }, save=False)
            graph_db.add_relationship(ins.asset_id, node_id, "HAS_INSPECTION", save=False)

        # 4. Fetch and add Incidents (FailureEvents)
        incidents = db.query(IncidentReport).all()
        for inc in incidents:
            node_id = f"INC-{inc.id}"
            graph_db.add_node(node_id, "FailureEvent", {
                "title": inc.title,
                "severity": inc.severity,
                "date": inc.timestamp.strftime("%Y-%m-%d"),
                "root_cause": inc.root_cause or "Under investigation"
            }, save=False)
            graph_db.add_relationship(inc.asset_id, node_id, "SUFFERED_FAILURE", save=False)

        # 5. Fetch and add Maintenance records and link to Personnel
        technicians = set()
        maintenance_logs = db.query(MaintenanceLog).limit(300).all() # Limit graph nodes to prevent clutter
        for log in maintenance_logs:
            log_node_id = f"ML-{log.id}"
            graph_db.add_node(log_node_id, "MaintenanceRecord", {
                "activity": log.activity,
                "status": log.status,
                "cost": log.cost,
                "date": log.timestamp.strftime("%Y-%m-%d")
            }, save=False)
            graph_db.add_relationship(log.asset_id, log_node_id, "HAS_MAINTENANCE", save=False)

            # Add Technician
            tech_node_id = log.technician.lower().replace(" ", "_")
            if tech_node_id not in technicians:
                graph_db.add_node(tech_node_id, "Personnel", {
                    "name": log.technician,
                    "role": "Maintenance Technician"
                }, save=False)
                technicians.add(tech_node_id)
            
            graph_db.add_relationship(tech_node_id, log_node_id, "PERFORMED", save=False)

        # 6. Global Compliance node and relationships
        graph_db.add_node("COMP-VIOLATION", "ComplianceRequirement", {
            "title": "Industrial Environmental and Emissions Safety Compliance (Section 12)",
            "regulatory_ref": "EPA Code 40 CFR / ASME Section I",
            "description": "Compliance limits governing safety valve operations, leak tolerances, and boiler pressure vessels."
        }, save=False)

        # Relate failed inspections and incidents to compliance violation
        failed_inspections = db.query(InspectionReport).filter(InspectionReport.status.in_(["Fail", "Flagged"])).all()
        for ins in failed_inspections:
            graph_db.add_relationship(f"IR-{ins.id}", "COMP-VIOLATION", "VIOLATED_COMPLIANCE", save=False)

        # Relate SOPs to Compliance
        compliance_sops = db.query(SOP).filter_by(category="Compliance").limit(10).all()
        for sop in compliance_sops:
            graph_db.add_relationship(sop.id, "COMP-VIOLATION", "COMPLIES_WITH", save=False)

        # Link random SOPs to Assets for context
        for asset in assets[:50]:
            # Link to some category-appropriate SOP
            for sop in sops[:20]:
                if sop.category == "Maintenance" and asset.status in ["Under Maintenance", "Critical"]:
                    graph_db.add_relationship(asset.id, sop.id, "REQUIRES_PROCEDURE", save=False)
                elif sop.category == "Safety" and asset.critical_risk in ["High", "Extreme"]:
                    graph_db.add_relationship(asset.id, sop.id, "GOVERNED_BY", save=False)

        # Save to local store fallback once at the end
        graph_db.local_store.save()

        logger.info(f"Graph sync complete. Indexed {len(assets)} assets and relevant documents.")
        return {"status": "success", "synced_nodes": len(assets) + len(sops)}
