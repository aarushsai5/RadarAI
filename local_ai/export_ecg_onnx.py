import torch
from torchvision import models
import torch.nn as nn
import os

def export_ecg_model():
    model_path = r"D:\XRAY APP\local_models\ecg_model.pth"
    onnx_path = r"D:\XRAY APP\public\models\ecg_model.onnx"
    
    # Recreate the model structure
    model = models.mobilenet_v3_large(weights=None)
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, 2) # 2 classes for ECG (Abnormal, Normal)
    
    # Load weights
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    
    print("Exporting ECG model to ONNX...")
    dummy_input = torch.randn(1, 3, 224, 224)
    
    # Fix encoding environment variable
    os.environ["PYTHONIOENCODING"] = "utf-8"
    
    # ONNX export
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"ECG model exported successfully to {onnx_path}")

if __name__ == "__main__":
    export_ecg_model()
