import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os

# --- 1. CONFIGURATION ---
# Mets ici le chemin vers ton fichier .pth
MODEL_PATH = "dermavision_epoch_5.pth"

# Mets ici le chemin d'une image que tu veux tester (ex: une image téléchargée sur Google)
IMAGE_TO_TEST = r"benign2.png" 

def load_dermavision_model(model_path):
    print("Chargement du modèle...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 1. On recharge l'architecture de base (EfficientNet B0)
    # Note : On ne met pas weights='DEFAULT' car on va écraser les poids juste après
    model = models.efficientnet_b0()

    # 2. On réapplique la modification de la dernière couche (INDISPENSABLE)
    # C'est ce qui permet au fichier .pth de "rentrer" dans le modèle
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_features, 1)

    # 3. On charge tes poids entrainés
    try:
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        print("Poids chargés avec succès !")
    except FileNotFoundError:
        print(f"Erreur : Le fichier {model_path} est introuvable.")
        exit()
    except Exception as e:
        print(f"Erreur de chargement : {e}")
        exit()

    model.to(device)
    model.eval() # Mode évaluation (fige le dropout, etc.)
    return model, device

def predict_image(image_path, model, device):
    # 1. Prétraitement (Le même que pour l'entraînement, sans la Data Augmentation)
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Ouvrir et transformer l'image
    try:
        image = Image.open(image_path).convert("RGB")
    except FileNotFoundError:
        print(f"Impossible d'ouvrir l'image : {image_path}")
        return

    input_tensor = preprocess(image)
    input_tensor = input_tensor.unsqueeze(0) # Ajoute la dimension batch (1, 3, 224, 224)
    input_tensor = input_tensor.to(device)

    # 3. Prédiction
    with torch.no_grad():
        output = model(input_tensor)
        
        # On applique Sigmoid car ton modèle sort des "logits" (valeurs brutes)
        # Sigmoid transforme ça en probabilité entre 0 et 1
        probability = torch.sigmoid(output).item()

    # 4. Résultat
    percentage = probability * 100
    label = "MALIN (Mélanome)" if probability > 0.5 else "BÉNIN"
    color = "\033[91m" if probability > 0.5 else "\033[92m" # Rouge si malin, Vert si bénin
    reset = "\033[0m"

    print("-" * 30)
    print(f"Image analysée : {os.path.basename(image_path)}")
    print(f"Probabilité mélanome : {percentage:.2f}%")
    print(f"Diagnostic IA : {color}{label}{reset}")
    print("-" * 30)

# --- EXECUTION ---
if __name__ == "__main__":
    # Charge le modèle une seule fois
    model, device = load_dermavision_model(MODEL_PATH)

    # Lance la prédiction
    predict_image(IMAGE_TO_TEST, model, device)