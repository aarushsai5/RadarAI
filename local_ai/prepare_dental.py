"""
Dental Dataset Preprocessor
----------------------------
The dental dataset uses a flat folder + _annotations.csv format (object detection style).
This script converts it into an ImageFolder structure suitable for classification training
by cropping annotated regions and organizing them into class folders.
"""
import os
import csv
import shutil
from PIL import Image

def prepare_dental_dataset(src_dir, output_dir):
    """
    Reads _annotations.csv from src_dir, crops each annotated region,
    and saves it into output_dir/<class_name>/ folders.
    """
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(src_dir, "_annotations.csv")
    
    if not os.path.exists(csv_path):
        print(f"ERROR: No _annotations.csv found in {src_dir}")
        return
    
    counts = {}
    errors = 0
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']
            cls = row['class'].strip()
            xmin = int(row['xmin'])
            ymin = int(row['ymin'])
            xmax = int(row['xmax'])
            ymax = int(row['ymax'])
            
            # Create class directory
            cls_dir = os.path.join(output_dir, cls)
            os.makedirs(cls_dir, exist_ok=True)
            
            img_path = os.path.join(src_dir, filename)
            if not os.path.exists(img_path):
                errors += 1
                continue
            
            try:
                img = Image.open(img_path).convert("RGB")
                # Crop the annotated region
                crop = img.crop((xmin, ymin, xmax, ymax))
                
                # Ensure minimum size (skip tiny crops)
                if crop.width < 10 or crop.height < 10:
                    continue
                
                # Save with unique name
                count = counts.get(cls, 0)
                save_name = f"{cls}_{count:05d}.jpg"
                crop.save(os.path.join(cls_dir, save_name), "JPEG", quality=95)
                counts[cls] = count + 1
            except Exception as e:
                errors += 1
                continue
    
    print(f"\n=== Dental Dataset Preparation Complete ===")
    print(f"Output directory: {output_dir}")
    for cls, cnt in sorted(counts.items()):
        print(f"  {cls}: {cnt} cropped images")
    if errors:
        print(f"  Skipped {errors} entries due to errors")
    print()

if __name__ == "__main__":
    # Process train, valid, and test splits
    base = r"D:\XRAY DATA\dental dataset"
    output_base = r"D:\XRAY APP\local_ai\dental_prepared"
    
    for split in ["train", "valid", "test"]:
        src = os.path.join(base, split)
        if os.path.exists(src):
            print(f"\n--- Processing {split} split ---")
            prepare_dental_dataset(src, os.path.join(output_base, split))
    
    # Also create a combined train+valid folder for maximum training data
    combined = os.path.join(output_base, "combined")
    os.makedirs(combined, exist_ok=True)
    for split in ["train", "valid"]:
        split_dir = os.path.join(output_base, split)
        if not os.path.exists(split_dir):
            continue
        for cls in os.listdir(split_dir):
            cls_src = os.path.join(split_dir, cls)
            cls_dst = os.path.join(combined, cls)
            os.makedirs(cls_dst, exist_ok=True)
            if os.path.isdir(cls_src):
                for img in os.listdir(cls_src):
                    src_file = os.path.join(cls_src, img)
                    dst_file = os.path.join(cls_dst, f"{split}_{img}")
                    shutil.copy2(src_file, dst_file)
    
    print("\n=== Combined dataset created ===")
    for cls in sorted(os.listdir(combined)):
        cls_path = os.path.join(combined, cls)
        if os.path.isdir(cls_path):
            print(f"  {cls}: {len(os.listdir(cls_path))} images")
