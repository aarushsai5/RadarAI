import os
import json
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

app = FastAPI(title="ClarivueAI Local Inference Server")

# Enable CORS for the React front-end (localhost:5173 / localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = "local_models"
sessions = {}
class_maps = {}

def get_ort_session(scan_type: str):
    """
    Dynamically loads and caches the ONNX session and class mapping for a scan type.
    """
    if scan_type in sessions:
        return sessions[scan_type], class_maps[scan_type]

    onnx_path = os.path.join(MODELS_DIR, f"{scan_type}_model.onnx")
    classes_path = os.path.join(MODELS_DIR, f"{scan_type}_classes.json")

    if not os.path.exists(onnx_path) or not os.path.exists(classes_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model files for {scan_type} not found. Please run the training script first."
        )

    # Load class maps
    with open(classes_path, 'r') as f:
        idx_to_class = json.load(f)
    class_maps[scan_type] = idx_to_class

    # Set up Execution Providers: DirectML (AMD/Intel GPU) first, CPU fallback
    available_providers = ort.get_available_providers()
    print(f"Available ONNX providers: {available_providers}")
    
    providers = []
    if "DmlExecutionProvider" in available_providers:
        providers.append("DmlExecutionProvider")
    providers.append("CPUExecutionProvider")

    print(f"Loading {scan_type} model with providers: {providers}")
    session = ort.InferenceSession(onnx_path, providers=providers)
    sessions[scan_type] = session

    return session, idx_to_class

def preprocess_image(image_bytes: bytes):
    """
    Preprocess image to match training parameters (MobileNetV3 resize & normalization).
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize to 224x224
    image = image.resize((224, 224))
    
    # Convert to numpy array and scale to [0, 1]
    img_data = np.array(image).astype(np.float32) / 255.0
    
    # Normalize with ImageNet mean and std
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_data = (img_data - mean) / std
    
    # Transpose dimensions from HWC to CHW and add batch dimension (1, C, H, W)
    img_data = np.transpose(img_data, (2, 0, 1))
    img_data = np.expand_dims(img_data, axis=0)
    return img_data

def softmax(x):
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=1, keepdims=True)

@app.get("/status")
def get_status():
    """
    Returns lists of trained and ready models.
    """
    trained = []
    if os.path.exists(MODELS_DIR):
        for file in os.listdir(MODELS_DIR):
            if file.endswith("_model.onnx"):
                trained.append(file.replace("_model.onnx", ""))
    return {"status": "online", "trained_models": trained}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    scan_type: str = Form("xray")
):
    try:
        session, idx_to_class = get_ort_session(scan_type)
        
        # Read and preprocess image
        contents = await file.read()
        input_data = preprocess_image(contents)
        
        # Run inference
        inputs = {session.get_inputs()[0].name: input_data}
        outputs = session.run(None, inputs)
        logits = outputs[0]
        
        # Calculate probabilities
        probs = softmax(logits)[0]
        top_idx = int(np.argmax(probs))
        
        prediction = idx_to_class[str(top_idx)]
        confidence = float(probs[top_idx])

        # Return full prediction list sorted by probability
        all_predictions = [
            {"label": idx_to_class[str(i)], "probability": float(probs[i])}
            for i in range(len(probs))
        ]
        all_predictions = sorted(all_predictions, key=lambda x: x["probability"], reverse=True)

        return {
            "prediction": prediction,
            "confidence": confidence,
            "predictions": all_predictions,
            "device": session.get_providers()[0]  # Returns DmlExecutionProvider if GPU acceleration active
        }
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Bind to localhost:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
