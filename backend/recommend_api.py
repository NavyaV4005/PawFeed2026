import os
import joblib
import pandas as pd
import numpy as np
import warnings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Suppress scikit-learn version mismatch warnings
warnings.filterwarnings("ignore")

app = FastAPI(title="PawFeed Smart Recipe Recommendation API", version="1.0.0")

# Enable CORS for local dev and mobile web view
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Cache models, scalers, and datasets in memory
model_cache = {}

class RecommendationRequest(BaseModel):
    species: str = Field(..., example="Dog")
    name: str = Field("Pet", example="Bruno")
    age: float = Field(..., example=4.0)
    weight: float = Field(..., example=18.0)
    calories: float = Field(..., example=900.0)

def load_species_assets(species_name: str):
    sp = species_name.lower().strip()
    if sp in model_cache:
        return model_cache[sp]
    
    model_path = os.path.join(MODELS_DIR, f"{sp}_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, f"{sp}_scaler.pkl")
    csv_path = os.path.join(MODELS_DIR, f"{sp}_recipes.csv")
    
    # Fallback to dog if species asset not found
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(csv_path)):
        sp = "dog"
        model_path = os.path.join(MODELS_DIR, f"dog_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, f"dog_scaler.pkl")
        csv_path = os.path.join(MODELS_DIR, f"dog_recipes.csv")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    df = pd.read_csv(csv_path)

    assets = {
        "model": model,
        "scaler": scaler,
        "df": df,
        "species": sp
    }
    model_cache[sp] = assets
    return assets

@app.get("/")
def read_root():
    return {"status": "online", "message": "PawFeed ML Recommendation API is running."}

@app.post("/recommend")
def recommend_recipes(req: RecommendationRequest):
    try:
        assets = load_species_assets(req.species)
        model = assets["model"]
        scaler = assets["scaler"]
        df = assets["df"]

        # Scale input features [Age_Years, Weight_Kg, Target_Calories]
        raw_features = np.array([[req.age, req.weight, req.calories]])
        scaled_features = scaler.transform(raw_features)

        # Retrieve top 5 nearest neighbors
        distances, indices = model.kneighbors(scaled_features, n_neighbors=5)
        dist_list = distances[0]
        idx_list = indices[0]

        top_df = df.iloc[idx_list].copy()

        # Calculate user-facing match percentages (98%, 96%, 95%, 93%, 91%)
        ranks = ["🥇", "🥈", "🥉", "4th", "5th"]
        
        # Calculate dynamic percentage based on Euclidean distance
        # Standardize distances to a realistic 90%-99% scale for presentation
        min_d = min(dist_list) if len(dist_list) > 0 else 0
        max_d = max(dist_list) if len(dist_list) > 0 else 1

        recommendations = []
        base_matches = [98, 96, 95, 93, 91]

        for idx_pos, (row_idx, dist_val) in enumerate(zip(idx_list, dist_list)):
            row = df.iloc[row_idx]

            # Calculate match percentage
            if max_d > min_d:
                norm_score = 98 - int(((dist_val - min_d) / (max_d - min_d)) * 7)
            else:
                norm_score = base_matches[idx_pos]

            match_pct = max(85, min(99, norm_score))

            def parse_item(val):
                if pd.isna(val) or val is None:
                    return []
                if isinstance(val, list):
                    return val
                return [s.strip() for s in str(val).split(",") if s.strip()]

            def get_val(keys, default=""):
                for k in keys:
                    if k in row.index:
                        val = row[k]
                        if pd.notna(val):
                            return val
                return default

            cal_val = get_val(["Calories", "calories"], 0)
            prot_val = get_val(["Protein", "protein"], 0)
            fat_val = get_val(["Fat", "fat"], 0)
            carbs_val = get_val(["Carbs", "carbohydrates", "Carbohydrates"], 0)

            rec = {
                "rank": idx_pos + 1,
                "badge": ranks[idx_pos],
                "id": str(get_val(["ID", "id"], f"REC_{idx_pos}")),
                "recipe_name": str(get_val(["Recipe", "recipe_name", "Recipe Name"], "Custom Recipe")),
                "match_percent": match_pct,
                "match": f"{match_pct}% Match",
                "calories": float(cal_val) if cal_val != "" else 0.0,
                "protein": f"{float(prot_val):.1f}".rstrip('0').rstrip('.') + "g" if prot_val != "" else "0g",
                "fat": f"{float(fat_val):.1f}".rstrip('0').rstrip('.') + "g" if fat_val != "" else "0g",
                "carbs": f"{float(carbs_val):.1f}".rstrip('0').rstrip('.') + "g" if carbs_val != "" else "0g",
                "cook_time": str(get_val(["Cook Time", "cook_time"], "20 mins")),
                "difficulty": str(get_val(["Difficulty", "difficulty"], "Easy")),
                "benefits": parse_item(get_val(["Benefits", "health_benefits", "Health Benefits"], [])),
                "conditions": parse_item(get_val(["Conditions", "health_conditions_supported", "Health Conditions Supported"], [])),
                "ingredients": parse_item(get_val(["Ingredients", "ingredients"], [])),
                "quantities": parse_item(get_val(["Quantities", "ingredient_quantities", "Ingredient Quantities"], [])),
                "steps": parse_item(get_val(["Steps", "preparation_steps", "Preparation Steps"], []))
            }
            recommendations.append(rec)

        return {
            "status": "success",
            "pet_name": req.name,
            "species": req.species,
            "age": req.age,
            "weight": req.weight,
            "calories": req.calories,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("recommend_api:app", host="0.0.0.0", port=8000, reload=True)
