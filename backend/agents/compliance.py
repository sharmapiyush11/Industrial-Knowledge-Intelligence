import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, InspectionReport, SOP, IncidentReport
import logging

logger = logging.getLogger(__name__)

class ComplianceIntelligenceAgent:
    def __init__(self):
        pass

    def run_compliance_audit(self, db: Session) -> dict:
        """
        Runs a comprehensive compliance audits across assets and documents.
        Checks for:
        1. Expired certifications (cert_expiry < now)
        2. Missing inspections (assets with no inspections or older than 365 days)
        3. Compliance violations (flagged/failed inspections, unresolved critical incidents)
        4. Gaps in SOP documentation (asset types with no matching SOP procedures)
        """
        now = datetime.datetime.utcnow()
        assets = db.query(Asset).all()
        sops = db.query(SOP).all()

        violations = []
        missing_inspections = []
        expired_certs = []
        document_gaps = []

        total_checks = len(assets) * 3
        passed_checks = total_checks

        # Check documentation gaps (SOP categories matching asset types)
        asset_types = set(a.type for a in assets)
        for atype in asset_types:
            has_sop = any(atype.lower() in sop.title.lower() or atype.lower() in sop.content.lower() for sop in sops)
            if not has_sop:
                document_gaps.append({
                    "type": "Missing SOP",
                    "details": f"No Standard Operating Procedure (SOP) found mapping to asset type '{atype}'.",
                    "severity": "Medium",
                    "action_required": f"Draft and upload operating regulations for all {atype} assets."
                })
                passed_checks -= 1

        for asset in assets:
            # 1. Check Inspections
            inspections = db.query(InspectionReport).filter_by(asset_id=asset.id).order_by(InspectionReport.timestamp.desc()).all()
            
            if not inspections:
                missing_inspections.append({
                    "asset_id": asset.id,
                    "name": asset.name,
                    "plant": asset.plant,
                    "last_inspection": "Never",
                    "status": "Overdue"
                })
                passed_checks -= 1
            else:
                latest = inspections[0]
                days_since_inspection = (now - latest.timestamp).days
                
                # Check expiry
                if latest.cert_expiry and latest.cert_expiry < now:
                    expired_certs.append({
                        "asset_id": asset.id,
                        "name": asset.name,
                        "plant": asset.plant,
                        "cert_id": f"CERT-IR-{latest.id}",
                        "expired_on": latest.cert_expiry.strftime("%Y-%m-%d")
                    })
                    passed_checks -= 1
                elif days_since_inspection > 365:
                    missing_inspections.append({
                        "asset_id": asset.id,
                        "name": asset.name,
                        "plant": asset.plant,
                        "last_inspection": latest.timestamp.strftime("%Y-%m-%d"),
                        "status": f"Overdue ({days_since_inspection} days ago)"
                    })
                    passed_checks -= 1

                # Check violations (Fail/Flagged status)
                if latest.status in ["Fail", "Flagged"]:
                    violations.append({
                        "id": f"VIOL-{latest.id}",
                        "asset_id": asset.id,
                        "name": asset.name,
                        "plant": asset.plant,
                        "source": f"Inspection Report IR-{latest.id}",
                        "finding": latest.findings,
                        "severity": "High" if latest.status == "Fail" else "Medium",
                        "date": latest.timestamp.strftime("%Y-%m-%d")
                    })
                    passed_checks -= 1

            # 2. Check Unresolved Critical Incidents
            critical_incidents = db.query(IncidentReport).filter_by(asset_id=asset.id).filter(IncidentReport.severity.in_(["High", "Critical"])).all()
            for inc in critical_incidents:
                # If root cause or action taken is empty or has placeholder text
                if not inc.action_taken or "under investigation" in (inc.root_cause or "").lower():
                    violations.append({
                        "id": f"VIOL-INC-{inc.id}",
                        "asset_id": asset.id,
                        "name": asset.name,
                        "plant": asset.plant,
                        "source": f"Incident Report INC-{inc.id}",
                        "finding": f"Unresolved critical breakdown: {inc.title}",
                        "severity": "Critical",
                        "date": inc.timestamp.strftime("%Y-%m-%d")
                    })
                    passed_checks -= 1

        # Calculate Scores
        audit_readiness_score = max(0.0, min(100.0, (passed_checks / total_checks) * 100.0)) if total_checks > 0 else 100.0

        return {
            "audit_readiness_score": round(audit_readiness_score, 1),
            "compliance_score": round(max(30.0, audit_readiness_score - (len(violations) * 3.5)), 1),
            "stats": {
                "active_violations": len(violations),
                "missing_inspections": len(missing_inspections),
                "expired_certifications": len(expired_certs),
                "sop_documentation_gaps": len(document_gaps)
            },
            "violations": violations,
            "missing_inspections": missing_inspections,
            "expired_certifications": expired_certs,
            "sop_gaps": document_gaps
        }
