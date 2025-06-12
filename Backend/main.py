from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import cv2
import joblib
from color_utils import calculate_average_deltaE, calculate_avg_hsb

app = FastAPI()
@app.get("/")
def read_root():
    return {"message": "Color API is running 🚀"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("models/color_quality_model.pkl")

@app.post("/analyze")
async def analyze_color(reference_r: int = Form(...), reference_g: int = Form(...), reference_b: int = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    img = cv2.resize(img, (300, 300))
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    reference_rgb = (reference_r, reference_g, reference_b)
    avg_delta_e = calculate_average_deltaE(reference_rgb, img_rgb)

    h2, s2, b2 = calculate_avg_hsb(img)
    ref_bgr = np.uint8([[list(reference_rgb)]])
    ref_hsv = cv2.cvtColor(ref_bgr, cv2.COLOR_RGB2HSV)[0][0]
    h1, s1, b1 = ref_hsv

    features = [avg_delta_e, abs(h1 - h2), abs(s1 - s2), abs(b1 - b2)]
    prediction = model.predict([features])[0]
    accuracy = max(0, 100 - (avg_delta_e / 20) * 100)

    return {
        "delta_e": avg_delta_e,
        "accuracy": accuracy,
        "features": {
            "hue_diff": abs(h1 - h2),
            "sat_diff": abs(s1 - s2),
            "bright_diff": abs(b1 - b2)
        },
        "prediction": prediction
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
