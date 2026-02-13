import xgboost as xgb
import numpy as np
import os

class XGBRiskModel:
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load pre-trained XGBoost model"""
        model_path = "xgboost_risk_model.json"
        
        # NOTE: If you changed the training logic, delete the .json file 
        # or use 'if False' to force retraining once.
        if os.path.exists(model_path):
            self.model = xgb.XGBRegressor()
            self.model.load_model(model_path)
            print("✅ Loaded existing XGBoost model")
        else:
            self.model = xgb.XGBRegressor(n_estimators=100, max_depth=6)
            self._train_dummy_model()
            self.model.save_model(model_path)
            print("🚀 Retrained and saved new XGBoost model")
    
    def _train_dummy_model(self):
        """Fixed Indentation: Training logic that respects mitigation"""
        np.random.seed(42)
        X = np.random.rand(1000, 8) * 10 
        
        # Feature index 7 is mitigation. 
        # High Mitigation (X7) now HEAVILY reduces Risk (y).
        y = (X[:, 0] * 0.5 + X[:, 3] * 0.4 + X[:, 1] * 0.2) - (X[:, 7] * 1.5) 
        y = np.clip(y, 0, 10) 
        
        self.model.fit(X, y)
    
    def predict_risk(self, features):
        """Predict risk score from feature vector"""
        if self.model is None:
            return 0.5, "Medium", "Model not loaded"
        
        feature_array = np.array([features]).reshape(1, -1)
        score = self.model.predict(feature_array)[0]
        
        # Map score to category
        if score < 2.0: category = "Low"
        elif score < 4.5: category = "Medium"
        elif score < 7.5: category = "High"
        else: category = "Critical"
        
        return float(score), category, f"XGBoost:{score:.2f}"

    def get_feature_names(self):
        return [
            "span_length", "cost_impact", "delay_days", "dependency_count",
            "importance_factor", "redundancy_score", "inspection_score", "mitigation_score"
        ]

# Global instance
risk_model = XGBRiskModel()