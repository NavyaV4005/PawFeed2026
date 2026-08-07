import sys
import json
import os
import joblib
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

def recommend_single(species, name, age, weight, calories):
    sp = species.lower().strip()
    model_path = os.path.join(MODELS_DIR, f"{sp}_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, f"{sp}_scaler.pkl")
    csv_path = os.path.join(MODELS_DIR, f"{sp}_recipes.csv")

    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(csv_path)):
        sp = "dog"
        model_path = os.path.join(MODELS_DIR, "dog_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "dog_scaler.pkl")
        csv_path = os.path.join(MODELS_DIR, "dog_recipes.csv")

    # If still missing, return clean error JSON so Node.js can handle it
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(csv_path)):
        print(json.dumps({
            "status": "error",
            "error": "Model files not found. Using client-side fallback.",
            "recommendations": []
        }))
        sys.exit(0)

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    df = pd.read_csv(csv_path)

    raw_features = np.array([[float(age), float(weight), float(calories)]])
    scaled_features = scaler.transform(raw_features)

    distances, indices = model.kneighbors(scaled_features, n_neighbors=5)
    dist_list = distances[0]
    idx_list = indices[0]

    ranks = ["🥇", "🥈", "🥉", "4th", "5th"]
    min_d = min(dist_list) if len(dist_list) > 0 else 0
    max_d = max(dist_list) if len(dist_list) > 0 else 1
    base_matches = [98, 96, 95, 93, 91]

    recommendations = []
    for idx_pos, (row_idx, dist_val) in enumerate(zip(idx_list, dist_list)):
        row = df.iloc[row_idx]

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
        "pet_name": name,
        "species": species,
        "age": float(age),
        "weight": float(weight),
        "calories": float(calories),
        "recommendations": recommendations
    }

if __name__ == "__main__":
    if len(sys.argv) > 5:
        sp = sys.argv[1]
        nm = sys.argv[2]
        ag = sys.argv[3]
        wt = sys.argv[4]
        cal = sys.argv[5]
    else:
        sp, nm, ag, wt, cal = "Dog", "Bruno", 4.0, 18.0, 900.0

    res = recommend_single(sp, nm, ag, wt, cal)
    print(json.dumps(res))
