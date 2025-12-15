import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os

# Configuration
MODEL_PATH = "dermavision_epoch_5.pth"

def load_dermavision_model(model_path=MODEL_PATH):
    print(f"Chargement du modèle depuis {model_path}...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 1. Load base architecture (EfficientNet B0)
    model = models.efficientnet_b0(weights=None) # We will load our own weights

    # 2. Re-apply modification to the last layer
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_features, 1)

    # 3. Load trained weights
    try:
        # Check if absolute path or relative
        if not os.path.exists(model_path):
             # Try looking in parent directory if we are in backend/
            parent_path = os.path.join("..", model_path)
            if os.path.exists(parent_path):
                model_path = parent_path
            
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        print("Poids chargés avec succès !")
    except FileNotFoundError:
        print(f"Erreur : Le fichier {model_path} est introuvable.")
        raise
    except Exception as e:
        print(f"Erreur de chargement : {e}")
        raise

    model.to(device)
    model.eval()
    return model, device

def predict_image(image_file, model, device):
    # 1. Preprocessing
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Open image
    try:
        image = Image.open(image_file).convert("RGB")
    except Exception as e:
        print(f"Impossible d'ouvrir l'image : {e}")
        raise

    input_tensor = preprocess(image)
    input_tensor = input_tensor.unsqueeze(0) # Add batch dimension
    input_tensor = input_tensor.to(device)

    # 3. Prediction
    with torch.no_grad():
        output = model(input_tensor)
        probability = torch.sigmoid(output).item()

    # 4. Result
    label = "MALIN (Mélanome)" if probability > 0.5 else "BÉNIN"
    is_malignant = probability > 0.5
    
    return {
        "probability": probability,
        "label": label,
        "is_malignant": is_malignant
    }
