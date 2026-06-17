import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

def generate_ecg_images(csv_path, out_dir, class_name, max_images=2000):
    os.makedirs(out_dir, exist_ok=True)
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return
        
    print(f"Processing {csv_path} for class {class_name}...")
    # Read CSV without header if it doesn't have one
    df = pd.read_csv(csv_path, header=None)
    
    # We only take up to max_images to save time generating plots
    df = df.head(max_images)
    
    for idx, row in df.iterrows():
        # Drop NaN or completely flat tails if any, typically the last column is the label
        data = row.values[:-1] if row.values[-1] in [0, 1, 0.0, 1.0] else row.values
        data = data[~np.isnan(data)]
        
        fig, ax = plt.subplots(figsize=(4, 2), dpi=100)
        ax.plot(data, color='black', linewidth=1.5)
        ax.axis('off')  # We don't want axes, just the line
        
        # Add a subtle grid like a real ECG paper
        ax.grid(color='red', linestyle='-', linewidth=0.2, alpha=0.3)
        ax.set_facecolor('#fff5f5')
        
        out_file = os.path.join(out_dir, f"{class_name}_{idx}.jpg")
        plt.savefig(out_file, bbox_inches='tight', pad_inches=0, format='jpg')
        plt.close(fig)
        
        if (idx + 1) % 500 == 0:
            print(f"  Generated {idx + 1} images...")

def prepare_ecg():
    out_dir = r"D:\XRAY APP\local_ai\ecg_prepared\combined"
    base = r"D:\XRAY DATA\ecg dataset"
    
    # PTBDB is usually better for structural abnormalities
    generate_ecg_images(os.path.join(base, "ptbdb_normal.csv"), os.path.join(out_dir, "Normal"), "ptb_normal", 300)
    generate_ecg_images(os.path.join(base, "ptbdb_abnormal.csv"), os.path.join(out_dir, "Abnormal"), "ptb_abnormal", 300)
    
    print("ECG dataset prepared at:", out_dir)
    for c in os.listdir(out_dir):
        print(f"  {c}: {len(os.listdir(os.path.join(out_dir, c)))} images")

if __name__ == "__main__":
    prepare_ecg()
