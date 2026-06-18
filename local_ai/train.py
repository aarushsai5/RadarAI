import os
import json
import argparse
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms, models
from PIL import Image

def build_dataset_subset(dataset_dir, max_images_per_class=2000):
    """
    Scans the dataset directory and returns a subset dataset where
    each class has at most max_images_per_class images.
    """
    # Define standard medical scan transformations
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    full_dataset = datasets.ImageFolder(root=dataset_dir, transform=transform)
    
    # Save the class map
    class_to_idx = full_dataset.class_to_idx
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    print(f"Detected classes: {class_to_idx}")

    # Group indices by class
    class_indices = {i: [] for i in range(len(class_to_idx))}
    for idx, (_, label) in enumerate(full_dataset.imgs):
        class_indices[label].append(idx)

    # Subsample to keep training fast
    subsampled_indices = []
    for label, indices in class_indices.items():
        if len(indices) > max_images_per_class:
            sampled = random.sample(indices, max_images_per_class)
            print(f"Class '{idx_to_class[label]}' subsampled from {len(indices)} to {max_images_per_class} images.")
        else:
            sampled = indices
            print(f"Class '{idx_to_class[label]}' has {len(indices)} images.")
        subsampled_indices.extend(sampled)

    subset_dataset = Subset(full_dataset, subsampled_indices)
    return subset_dataset, idx_to_class

def train_model(dataset_dir, output_dir, scan_type, epochs=5, batch_size=32, max_images=2000):
    os.makedirs(output_dir, exist_ok=True)
    print(f"--- Starting Training for {scan_type.upper()} ---")
    
    # Build dataset and class mapping
    dataset, idx_to_class = build_dataset_subset(dataset_dir, max_images)
    
    # Save classes mapping to JSON
    classes_path = os.path.join(output_dir, f"{scan_type}_classes.json")
    with open(classes_path, 'w') as f:
        json.dump(idx_to_class, f, indent=2)
    print(f"Class names saved to {classes_path}")

    # Split into train & validation (80-20)
    num_samples = len(dataset)
    train_size = int(0.8 * num_samples)
    val_size = num_samples - train_size
    train_set, val_set = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False, num_workers=0)

    # Initialize MobileNetV3 (lightweight, ideal for CPU/DirectML and fast inference)
    model = models.mobilenet_v3_large(pretrained=True)
    # Modify classifier layer
    num_classes = len(idx_to_class)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)

    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        epoch_loss = running_loss / len(train_set)
        epoch_acc = correct / total * 100
        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.2f}%")
        scheduler.step()

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_epoch_loss = val_loss / len(val_set)
        val_epoch_acc = val_correct / val_total * 100
        print(f"Validation Loss: {val_epoch_loss:.4f} | Validation Acc: {val_epoch_acc:.2f}%")

    # Save PyTorch weights
    model_pth_path = os.path.join(output_dir, f"{scan_type}_model.pth")
    torch.save(model.state_dict(), model_pth_path)
    print(f"Model weights saved to {model_pth_path}")

    # Export to ONNX
    onnx_path = os.path.join(output_dir, f"{scan_type}_model.onnx")
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    model.eval()
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"Successfully exported model to ONNX: {onnx_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train custom medical scan classifiers.")
    parser.add_argument("--dataset_dir", type=str, required=True, help="Path to the dataset directory (containing class folders)")
    parser.add_argument("--output_dir", type=str, default="public/models", help="Directory to save output files")
    parser.add_argument("--scan_type", type=str, default="xray", choices=["xray", "ecg", "mri", "ct"], help="Type of medical scan")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--max_images", type=int, default=2000, help="Max images per class to sample for fast training")
    
    args = parser.parse_args()
    train_model(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        scan_type=args.scan_type,
        epochs=args.epochs,
        max_images=args.max_images
    )
