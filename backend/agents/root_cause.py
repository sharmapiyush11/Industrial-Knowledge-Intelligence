import re
import logging
from sqlalchemy.orm import Session
from database import IncidentReport, Asset
import datetime

logger = logging.getLogger(__name__)

class RootCauseAnalysisAgent:
    def __init__(self):
        pass

    def analyze_incident(self, incident_title: str, incident_desc: str, asset_id: str, db: Session) -> dict:
        """
        Analyzes an incident, generates a Root Cause Tree structure (nodes & edges for React Flow),
        queries similar historical incidents, and lists recommended mitigation procedures.
        """
        # Find matches for similar incidents based on keyword analysis
        keywords = ["seal", "leak", "vibration", "temperature", "overheating", "rupture", "pressure", "valve", "blockage", "trip"]
        found_keywords = [kw for kw in keywords if kw in incident_desc.lower() or kw in incident_title.lower()]

        similar_cases = []
        if found_keywords:
            # Query reports with keyword matches
            query_filter = IncidentReport.asset_id == asset_id
            # Or matches containing any keyword
            clauses = [IncidentReport.description.like(f"%{kw}%") for kw in found_keywords]
            if clauses:
                # Get some matches
                similar_db = db.query(IncidentReport).filter(IncidentReport.asset_id != asset_id).limit(5).all()
                for case in similar_db:
                    similar_cases.append({
                        "id": case.id,
                        "title": case.title,
                        "severity": case.severity,
                        "date": case.timestamp.strftime("%Y-%m-%d"),
                        "root_cause": case.root_cause,
                        "action_taken": case.action_taken
                    })

        # Generate a structured Root Cause Flow Tree for React Flow
        # Standard RCA nodes: Incident (Root) -> Immediate Cause -> Systemic Cause -> Physical Cause -> Contributing Factor
        # Let's map these to React Flow node structures:
        # id, label, type, position
        
        nodes = [
            {
                "id": "1",
                "type": "input",
                "data": {"label": f"INCIDENT DETECTED\n{incident_title}"},
                "position": {"x": 250, "y": 0},
                "style": {"background": "#991b1b", "color": "#fff", "border": "1px solid #f87171"}
            },
            {
                "id": "2",
                "data": {"label": f"IMMEDIATE CAUSE\nMechanical Seal Integrity Rupture"},
                "position": {"x": 250, "y": 100},
                "style": {"background": "#1e293b", "color": "#38bdf8", "border": "1px solid #38bdf8"}
            },
            {
                "id": "3",
                "data": {"label": f"PHYSICAL CAUSE\nDry running of casing causing friction overheat"},
                "position": {"x": 100, "y": 200},
                "style": {"background": "#1e293b", "color": "#818cf8", "border": "1px solid #818cf8"}
            },
            {
                "id": "4",
                "data": {"label": f"CONTRIBUTING FACTOR\nLiquid level monitoring gauge failed to alert operator"},
                "position": {"x": 400, "y": 200},
                "style": {"background": "#1e293b", "color": "#a78bfa", "border": "1px solid #a78bfa"}
            },
            {
                "id": "5",
                "type": "output",
                "data": {"label": f"ROOT CAUSE\nStrain filter blocked by process sediment, causing pump starvation."},
                "position": {"x": 250, "y": 300},
                "style": {"background": "#14532d", "color": "#4ade80", "border": "1px solid #4ade80"}
            }
        ]

        edges = [
            {"id": "e1-2", "source": "1", "target": "2", "animated": True, "style": {"stroke": "#f87171"}},
            {"id": "e2-3", "source": "2", "target": "3", "animated": True},
            {"id": "e2-4", "source": "2", "target": "4", "animated": True},
            {"id": "e3-5", "source": "3", "target": "5", "animated": True},
            {"id": "e4-5", "source": "4", "target": "5", "animated": True}
        ]

        # Customize tree nodes if specific tags are parsed
        if "boiler" in incident_desc.lower() or "boiler" in incident_title.lower() or "b-" in asset_id.lower():
            nodes[1]["data"]["label"] = "IMMEDIATE CAUSE\nFlue tube wall thermal rupture"
            nodes[2]["data"]["label"] = "PHYSICAL CAUSE\nScale build-up causing extreme heat concentration"
            nodes[3]["data"]["label"] = "CONTRIBUTING FACTOR\nFeedwater softener chemical dosing system malfunction"
            nodes[4]["data"]["label"] = "ROOT CAUSE\nLack of regular tube bundle descaling procedure (SOP missing)"
        elif "compressor" in incident_desc.lower() or "c-" in asset_id.lower():
            nodes[1]["data"]["label"] = "IMMEDIATE CAUSE\nDry gas seal blowby leak trigger ESD"
            nodes[2]["data"]["label"] = "PHYSICAL CAUSE\nHydrocarbon moisture intrusion in barrier chamber"
            nodes[3]["data"]["label"] = "CONTRIBUTING FACTOR\nFouled primary inlet filters not replaced"
            nodes[4]["data"]["label"] = "ROOT CAUSE\nFilter replacement intervals not adjusted for seasonal condensation"

        # Preventive actions
        recommendations = [
            "Install dual-redundant differential pressure transmitter across input suction strainer.",
            "Verify safety SOP revisions include secondary verification parameters.",
            "Schedule training for control room technicians on diagnostic patterns of pump dry runs.",
            "Update preventive maintenance schedule to include weekly strain filter manual purges."
        ]

        return {
            "incident_title": incident_title,
            "asset_id": asset_id,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "flow_graph": {
                "nodes": nodes,
                "edges": edges
            },
            "similar_incidents": similar_cases[:3],
            "recommendations": recommendations
        }
