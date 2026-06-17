import os
import shutil

def copy_images(src_dir, dst_dir, class_name):
    os.makedirs(dst_dir, exist_ok=True)
    if not os.path.exists(src_dir):
        return
    for filename in os.listdir(src_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            src_path = os.path.join(src_dir, filename)
            # Make name unique just in case
            dst_path = os.path.join(dst_dir, f"{class_name}_{filename}")
            shutil.copy2(src_path, dst_path)

def prepare_xray():
    out_dir = r"D:\XRAY APP\local_ai\xray_prepared\combined"
    
    # 1. Pneumonia Dataset
    pneumonia_base = r"D:\XRAY DATA\PNEUMONIA DATASET\chest_xray"
    for split in ['train', 'val', 'test']:
        split_dir = os.path.join(pneumonia_base, split)
        if os.path.exists(split_dir):
            copy_images(os.path.join(split_dir, "NORMAL"), os.path.join(out_dir, "Normal"), "pneum_normal")
            copy_images(os.path.join(split_dir, "PNEUMONIA"), os.path.join(out_dir, "Pneumonia"), "pneumonia")
            
    # 2. Chest Cancer Dataset
    chest_base = r"D:\XRAY DATA\CHEST DATASET\Data"
    for split in ['train', 'valid', 'test']:
        split_dir = os.path.join(chest_base, split)
        if os.path.exists(split_dir):
            copy_images(os.path.join(split_dir, "normal"), os.path.join(out_dir, "Normal"), "chest_normal")
            copy_images(os.path.join(split_dir, "adenocarcinoma_left.lower.lobe_T2_N0_M0_Ib"), os.path.join(out_dir, "Adenocarcinoma"), "adeno")
            copy_images(os.path.join(split_dir, "large.cell.carcinoma_left.hilum_T2_N2_M0_IIIa"), os.path.join(out_dir, "Large_Cell_Carcinoma"), "large_cell")
            copy_images(os.path.join(split_dir, "squamous.cell.carcinoma_left.hilum_T1_N2_M0_IIIa"), os.path.join(out_dir, "Squamous_Cell_Carcinoma"), "squamous")
            
    print("X-Ray dataset merged and prepared at:", out_dir)
    for c in os.listdir(out_dir):
        print(f"  {c}: {len(os.listdir(os.path.join(out_dir, c)))} images")

if __name__ == "__main__":
    prepare_xray()
