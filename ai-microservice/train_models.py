import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_workload_balancer_model():
    print("Training Smart Workload Balancer ML Model...")
    
    # Synthetic feature dataset: [coding_accuracy, active_tasks, capacity_hours, complexity_index]
    np.random.seed(42)
    n_samples = 500
    
    coding_accuracy = np.random.uniform(85.0, 99.9, n_samples)
    active_tasks = np.random.randint(0, 10, n_samples)
    capacity_hours = np.random.uniform(4.0, 8.0, n_samples)
    complexity_index = np.random.uniform(1.0, 10.0, n_samples)
    
    # Match suitability score (Target)
    target_score = (coding_accuracy * 0.5) + ((10 - active_tasks) * 4) + (capacity_hours * 2) - (complexity_index * 1.5)
    
    X = np.column_stack((coding_accuracy, active_tasks, capacity_hours, complexity_index))
    y = target_score
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_scaled, y)
    
    joblib.dump(scaler, os.path.join(MODELS_DIR, "workload_scaler.pkl"))
    joblib.dump(model, os.path.join(MODELS_DIR, "workload_model.pkl"))
    print("Saved workload_model.pkl and workload_scaler.pkl")

def train_leave_risk_model():
    print("Training Leave SLA Risk Analysis ML Model...")
    
    np.random.seed(42)
    n_samples = 500
    
    leave_days = np.random.randint(1, 14, n_samples)
    urgent_batches = np.random.randint(0, 5, n_samples)
    staff_count = np.random.randint(2, 10, n_samples)
    
    # Target risk score 0-100%
    risk_score = np.clip((leave_days * 5.0) + (urgent_batches * 18.0) - (staff_count * 4.0), 5.0, 99.0)
    
    X = np.column_stack((leave_days, urgent_batches, staff_count))
    y = risk_score
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_scaled, y)
    
    joblib.dump(scaler, os.path.join(MODELS_DIR, "leave_risk_scaler.pkl"))
    joblib.dump(model, os.path.join(MODELS_DIR, "leave_risk_model.pkl"))
    print("Saved leave_risk_model.pkl and leave_risk_scaler.pkl")

if __name__ == "__main__":
    train_workload_balancer_model()
    train_leave_risk_model()
    print("All Scikit-Learn models trained and persisted successfully!")
