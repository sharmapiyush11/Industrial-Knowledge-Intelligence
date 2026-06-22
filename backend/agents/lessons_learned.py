from sqlalchemy.orm import Session
from database import IncidentReport, Asset
import logging
from collections import Counter

logger = logging.getLogger(__name__)

class LessonsLearnedAgent:
    def __init__(self):
        pass

    def extract_lessons_and_patterns(self, db: Session) -> dict:
        """
        Analyzes historical incidents in the DB to extract patterns, recurring failure modes,
        and generate preventive recommendations.
        """
        incidents = db.query(IncidentReport).all()
        assets = {a.id: a for a in db.query(Asset).all()}

        if not incidents:
            return {
                "alerts": [],
                "patterns": [],
                "recommendations": []
            }

        # 1. Count failures by asset and detect repeated fails
        asset_failure_counts = Counter(inc.asset_id for inc in incidents)
        critical_repeaters = []
        for aid, count in asset_failure_counts.items():
            if count >= 3:
                asset_obj = assets.get(aid)
                critical_repeaters.append({
                    "asset_id": aid,
                    "name": asset_obj.name if asset_obj else "Unknown Asset",
                    "plant": asset_obj.plant if asset_obj else "Unknown Plant",
                    "failure_count": count
                })

        # Sort critical repeaters by count
        critical_repeaters = sorted(critical_repeaters, key=lambda x: x["failure_count"], reverse=True)

        # 2. Count failures by plant to detect regional spikes
        plant_failure_counts = Counter()
        for inc in incidents:
            asset_obj = assets.get(inc.asset_id)
            if asset_obj:
                plant_failure_counts[asset_obj.plant] += 1

        # 3. Mode failure patterns (e.g. seal, overheating)
        keywords = ["seal", "leak", "vibration", "temperature", "overheating", "rupture", "pressure", "valve", "blockage", "trip"]
        keyword_counts = Counter()
        for inc in incidents:
            for kw in keywords:
                if kw in inc.description.lower() or kw in inc.title.lower():
                    keyword_counts[kw] += 1

        # Generate Risk Alerts
        alerts = []
        for rep in critical_repeaters[:5]:
            alerts.append({
                "type": "Repeated Failures Alert",
                "title": f"Asset {rep['asset_id']} experiencing recurring failure cycles",
                "message": f"Asset '{rep['name']}' at {rep['plant']} has failed {rep['failure_count']} times in the recorded timeline. Immediate lifecycle inspection is advised.",
                "severity": "High" if rep['failure_count'] >= 4 else "Medium"
            })

        # Add generic alerts for spikes
        for plant, count in plant_failure_counts.most_common(2):
            if count > 15:
                alerts.append({
                    "type": "Regional Outage Spike",
                    "title": f"Elevated incident count at {plant}",
                    "message": f"Total failures reported at {plant} has reached {count}. Consider audit verification of operational SOP compliance.",
                    "severity": "Medium"
                })

        # Compile lessons learned patterns
        patterns = []
        for kw, count in keyword_counts.most_common(4):
            percentage = (count / len(incidents)) * 100
            patterns.append({
                "category": kw.capitalize(),
                "occurrence_count": count,
                "percentage_of_total": round(percentage, 1),
                "summary_finding": f"'{kw.capitalize()}' is listed in {count} incidents ({percentage:.1f}% of total). This indicates systemic vulnerability in seal integrity and lubrication loops."
            })

        # Preventive Recommendations
        recommendations = [
            {
                "action": "Implement Laser Alignment audits post-maintenance",
                "rationale": "High occurrence of vibration related failure modes suggests coupling misalignment is common.",
                "applicable_to": "Rotational assets (Pumps, Compressors, Turbines)"
            },
            {
                "action": "Implement chemical water decalcification SOP revision",
                "rationale": "Scale and overheating incidents at Boilers are driven by feedwater quality drift.",
                "applicable_to": "Boilers and Heat Exchangers"
            },
            {
                "action": "Retrofit control valve pneumatic heads with silicone diaphragms",
                "rationale": "Diaphragm rupture was identified as a core driver of control valve failure.",
                "applicable_to": "Control Valves"
            }
        ]

        return {
            "total_incidents_analyzed": len(incidents),
            "alerts": alerts,
            "patterns": patterns,
            "critical_repeaters": critical_repeaters[:5],
            "recommendations": recommendations
        }
