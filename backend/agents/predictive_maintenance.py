# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
from sklearn.ensemble import RandomForestClassifier
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, MaintenanceLog, IncidentReport, InspectionReport
import datetime
import logging

logger = logging.getLogger(__name__)

class PredictiveMaintenanceAgent:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.is_trained = False

    def extract_features(self, db: Session):
        """
        Extracts metrics from the database for ML training & predictions.
        Features per asset:
        1. age_days (install date to now)
        2. total_maintenance_runs (count of ML logs)
        3. failed_maintenance_runs (count of failed ML logs)
        4. total_maintenance_cost ($)
        5. total_incidents_count (incident count)
        6. average_inspection_score (0-100)
        7. days_since_last_maintenance (days)
        """
        assets = db.query(Asset).all()
        if not assets:
            return None, None

        now = datetime.datetime.utcnow()
        data = []
        labels = []

        for asset in assets:
            # Feature 1: Age
            age_days = (now - asset.install_date).days if asset.install_date else 365

            # Feature 2, 3, 4: Maintenance
            logs = db.query(MaintenanceLog).filter_by(asset_id=asset.id).all()
            total_m_runs = len(logs)
            failed_m_runs = sum(1 for l in logs if l.status == "Failed")
            total_m_cost = sum(l.cost for l in logs)
            
            # Days since last maintenance
            if logs:
                last_m_date = max(l.timestamp for l in logs)
                days_since_m = (now - last_m_date).days
            else:
                days_since_m = age_days # Fallback

            # Feature 5: Incidents
            incidents_count = db.query(IncidentReport).filter_by(asset_id=asset.id).count()

            # Feature 6: Inspections
            inspections = db.query(InspectionReport).filter_by(asset_id=asset.id).all()
            avg_insp_score = np.mean([i.score for i in inspections]) if inspections else 85.0

            feature_dict = {
                "asset_id": asset.id,
                "age_days": float(age_days),
                "total_maintenance_runs": float(total_m_runs),
                "failed_maintenance_runs": float(failed_m_runs),
                "total_maintenance_cost": float(total_m_cost),
                "total_incidents_count": float(incidents_count),
                "average_inspection_score": float(avg_insp_score),
                "days_since_last_maintenance": float(days_since_m)
            }
            data.append(feature_dict)

            # Labels for training: Is status offline or critical? (True=1, False=0)
            is_risk = 1 if asset.status in ["Critical", "Offline"] else 0
            labels.append(is_risk)

        df = pd.DataFrame(data)
        return df, np.array(labels)

    def train_model(self, db: Session):
        """
        Trains the Random Forest model on the seeded dataset.
        """
        try:
            df, y = self.extract_features(db)
            if df is None or len(df) < 10:
                logger.warning("Not enough assets for training. Using fallback heuristic.")
                return False

            # Drop non-feature columns
            X = df.drop(columns=["asset_id"])
            
            self.model.fit(X, y)
            self.is_trained = True
            logger.info("Random Forest predictive model trained successfully.")
            return True
        except Exception as e:
            logger.error(f"Error training predictive model: {e}")
            return False

    def predict_asset_risk(self, asset_id: str, db: Session) -> dict:
        """
        Uses the Random Forest model to predict risk profile, health score, and generates recommendations.
        """
        asset = db.query(Asset).filter_by(id=asset_id).first()
        if not asset:
            return {"error": "Asset not found"}

        now = datetime.datetime.utcnow()
        age_days = (now - asset.install_date).days if asset.install_date else 365
        logs = db.query(MaintenanceLog).filter_by(asset_id=asset_id).all()
        total_m_runs = len(logs)
        failed_m_runs = sum(1 for l in logs if l.status == "Failed")
        total_m_cost = sum(l.cost for l in logs)
        
        if logs:
            last_m_date = max(l.timestamp for l in logs)
            days_since_m = (now - last_m_date).days
        else:
            days_since_m = age_days

        incidents_count = db.query(IncidentReport).filter_by(asset_id=asset_id).count()
        inspections = db.query(InspectionReport).filter_by(asset_id=asset_id).all()
        avg_insp_score = np.mean([i.score for i in inspections]) if inspections else 85.0

        features = [
            age_days,
            total_m_runs,
            failed_m_runs,
            total_m_cost,
            incidents_count,
            avg_insp_score,
            days_since_m
        ]

        # Calculate failure probability
        if self.is_trained:
            try:
                features_df = pd.DataFrame([{
                    "age_days": float(age_days),
                    "total_maintenance_runs": float(total_m_runs),
                    "failed_maintenance_runs": float(failed_m_runs),
                    "total_maintenance_cost": float(total_m_cost),
                    "total_incidents_count": float(incidents_count),
                    "average_inspection_score": float(avg_insp_score),
                    "days_since_last_maintenance": float(days_since_m)
                }])
                prob = self.model.predict_proba(features_df)[0][1]
            except Exception:
                prob = self._heuristic_fail_prob(features)
        else:
            prob = self._heuristic_fail_prob(features)

        # Calculate Health Score based on probability & inspection score
        health_score = max(0.0, min(100.0, 100.0 - (prob * 60.0) - ((100.0 - avg_insp_score) * 0.40)))
        
        # Adjust based on current database state
        if asset.status == "Offline":
            health_score = min(health_score, 15.0)
            prob = max(prob, 0.90)
        elif asset.status == "Critical":
            health_score = min(health_score, 45.0)
            prob = max(prob, 0.60)

        # Risk Classification
        if health_score >= 85.0:
            risk = "Low"
        elif health_score >= 70.0:
            risk = "Medium"
        elif health_score >= 50.0:
            risk = "High"
        else:
            risk = "Extreme"

        # Generate specific recommendation based on feature anomalies
        recommendations = []
        if days_since_m > 180:
            recommendations.append("Time since last maintenance exceeds 6 months. Schedule standard servicing.")
        if failed_m_runs > 0:
            recommendations.append(f"Detected {failed_m_runs} failed maintenance log(s). Inspect coupling alignment and review procedural SOP.")
        if avg_insp_score < 75.0:
            recommendations.append(f"Asset failed or received a flagged inspection score ({avg_insp_score:.1f}%). Trigger audit inspection cycle immediately.")
        if incidents_count > 1:
            recommendations.append("Repeated incident failures detected. Trigger formal Root Cause Analysis (RCA) and review engineering tolerances.")
        if not recommendations:
            recommendations.append("Asset is operating inside nominal performance limits. Continue standard inspections.")

        return {
            "asset_id": asset_id,
            "name": asset.name,
            "type": asset.type,
            "health_score": round(health_score, 2),
            "failure_probability": round(prob, 4),
            "critical_risk": risk,
            "metrics": {
                "age_years": round(age_days / 365.25, 2),
                "maintenance_cycles": total_m_runs,
                "maintenance_cost": round(total_m_cost, 2),
                "incidents": incidents_count,
                "inspection_score": round(avg_insp_score, 2),
                "days_since_maintenance": days_since_m
            },
            "recommendations": recommendations
        }

    def _heuristic_fail_prob(self, features) -> float:
        # Fallback math if ML is fitting is skipped
        age_days, total_m_runs, failed_m, total_cost, inc_count, insp_score, days_since_m = features
        score = 0.0
        if days_since_m > 180:
            score += 0.15
        if failed_m > 0:
            score += 0.20
        if inc_count > 1:
            score += 0.30
        if insp_score < 75.0:
            score += 0.25
        score += min(0.10, age_days / 10000.0)
        return min(0.99, max(0.01, score))

    def update_all_asset_scores(self, db: Session):
        """
        Runs batch predictions across all assets in the database and updates their parameters.
        """
        assets = db.query(Asset).all()
        for asset in assets:
            res = self.predict_asset_risk(asset.id, db)
            asset.health_score = res["health_score"]
            asset.failure_prob = res["failure_probability"]
            asset.critical_risk = res["critical_risk"]
        db.commit()
