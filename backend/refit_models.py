import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Species-specific boundaries for sanitization
SPECIES_BOUNDS = {
    "dog": {
        "Age_Years": (0.1, 20.0),
        "Weight_Kg": (0.1, 100.0),
        "Target_Calories": (20.0, 5000.0)
    },
    "cat": {
        "Age_Years": (0.1, 25.0),
        "Weight_Kg": (0.1, 15.0),
        "Target_Calories": (10.0, 1500.0)
    },
    "rabbit": {
        "Age_Years": (0.1, 15.0),
        "Weight_Kg": (0.1, 12.0),
        "Target_Calories": (10.0, 1000.0)
    },
    "hamster": {
        "Age_Years": (0.1, 5.0),
        "Weight_Kg": (0.02, 0.25),
        "Target_Calories": (5.0, 300.0)
    },
    "bird": {
        "Age_Years": (0.1, 50.0),
        "Weight_Kg": (0.01, 2.0),
        "Target_Calories": (5.0, 500.0)
    }
}

def clean_and_refit():
    print("Starting master model refitting and sanitization...")
    for sp, bounds in SPECIES_BOUNDS.items():
        csv_path = os.path.join(MODELS_DIR, f"{sp}_recipes.csv")
        model_path = os.path.join(MODELS_DIR, f"{sp}_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, f"{sp}_scaler.pkl")

        if not os.path.exists(csv_path):
            print(f"Warning: {csv_path} not found. Skipping.")
            continue

        print(f"\nProcessing {sp.upper()}...")
        df = pd.read_csv(csv_path)
        print(f"  Loaded dataset with {len(df)} rows.")

        # Clip values to eliminate extreme outliers
        for col, (min_val, max_val) in bounds.items():
            before_min = df[col].min()
            before_max = df[col].max()
            df[col] = df[col].clip(lower=min_val, upper=max_val)
            print(f"  Sanitized {col}: range changed from [{before_min}, {before_max}] to [{df[col].min()}, {df[col].max()}]")

        # Save sanitized CSV back
        df.to_csv(csv_path, index=False)
        print("  Saved sanitized CSV dataset.")

        # Fit new StandardScaler and NearestNeighbors
        features = df[["Age_Years", "Weight_Kg", "Target_Calories"]].values
        
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        model = NearestNeighbors(n_neighbors=5, metric="euclidean")
        model.fit(features_scaled)

        # Dump new models
        joblib.dump(scaler, scaler_path)
        joblib.dump(model, model_path)
        print(f"  Successfully regenerated models: {os.path.basename(scaler_path)} & {os.path.basename(model_path)}")

    print("\nAll recommendation models are now sanitized and fully refitted!")

if __name__ == "__main__":
    clean_and_refit()
