import torch  # Importe la bibliotheque principale PyTorch pour le Deep Learning
import torch.nn as nn  # Importe les modules de reseaux de neurones (couches, fonctions de perte)
import torch.optim as optim  # Importe les optimiseurs (Adam, SGD, etc.) pour mettre a jour les poids
from torchvision import models, transforms  # Importe les modeles pre-entraines et les outils de transformation d'image
from torch.utils.data import Dataset, DataLoader  # Importe les classes pour gerer les donnees et les charger par lots
from PIL import Image  # Importe la librairie Pillow pour ouvrir et manipuler les fichiers images
import pandas as pd  # Importe Pandas pour lire et manipuler le fichier CSV (Excel-like)
import os  # Importe le module systeme pour gerer les chemins de fichiers (Windows/Linux)
from tqdm import tqdm  # Importe TQDM pour afficher une barre de progression jolie dans la console

# --- CONFIGURATION LOCALE ---
# Definit le chemin du dossier contenant les images (le 'r' devant signifie "raw string" pour ignorer les caracteres speciaux Windows)
IMG_DIR = r"D:\docu\games\train" 
# Definit le chemin vers le fichier CSV qui contient les noms d'images et les labels (0 ou 1)
CSV_FILE = r"D:\docu\games\ISIC_2020_Training_GroundTruth.csv"

# --- PARAMETRES POUR LA 1660 SUPER ---
BATCH_SIZE = 16  # Definit le nombre d'images traitees en une seule fois (16 est sur pour 6Go de VRAM)
NUM_WORKERS = 4  # Definit le nombre de coeurs CPU utilises pour charger les images en parallele (accelere le processus)

# --- 1. CLASSE DU DATASET PERSONNALISE ---
class ISICDataset(Dataset):  # Cree une classe qui herite de Dataset (standard PyTorch)
    def __init__(self, csv_file, img_dir, transform=None):  # Fonction d'initialisation appelee a la creation de l'objet
        self.annotations = pd.read_csv(csv_file)  # Charge tout le fichier CSV en memoire dans un DataFrame Pandas
        self.img_dir = img_dir  # Stocke le chemin du dossier images dans l'objet
        self.transform = transform  # Stocke les transformations a appliquer (redimensionnement, etc.)

    def __len__(self):  # Fonction qui retourne la taille totale du dataset
        return len(self.annotations)  # Retourne le nombre de lignes dans le fichier CSV

    def __getitem__(self, index):  # Fonction critique : recupere UNE image et SON label a un index donne
        img_id = self.annotations.iloc[index, 0]  # Recupere l'ID de l'image (colonne 0) a la ligne 'index'
        img_name = os.path.join(self.img_dir, img_id + ".jpg")  # Construit le chemin complet (Dossier + ID + .jpg)
        
        try:  # Debut du bloc de securite pour l'ouverture de l'image
            image = Image.open(img_name).convert("RGB")  # Ouvre l'image et force la conversion en RGB (3 canaux couleurs)
        except FileNotFoundError:  # Si l'image n'est pas trouvee sur le disque
            print(f"Manquant: {img_name}")  # Affiche un message d'erreur dans la console
            image = Image.new('RGB', (224, 224))  # Cree une image noire vide pour eviter que le programme ne plante
            
        # Recupere le label (0 ou 1) depuis le CSV et le convertit en Tensor (format PyTorch)
        y_label = torch.tensor(int(self.annotations.iloc[index]['target']))

        if self.transform:  # Si des transformations sont definies (ce qui est le cas ici)
            image = self.transform(image)  # Applique les transformations (resize, normalize, to_tensor)

        return image, y_label  # Retourne la paire (Image traitee, Label)

# --- 2. FONCTION PRINCIPALE (SETUP) ---
def main():  # Definit la fonction principale pour encapsuler le code
    # Verifie si une carte graphique NVIDIA est disponible, sinon utilise le processeur
    #device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device("cuda")
    # Affiche le materiel utilise pour confirmer que CUDA est bien active
    #print(f"Materiel detecte : {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU (Aie!)'}")
    print(f"Materiel detecte : {torch.cuda.get_device_name(0)}")
    # Definit la pipeline de transformation des images
    my_transforms = transforms.Compose([
        transforms.Resize((224, 224)),  # Redimensionne toutes les images en 224x224 (taille standard EfficientNet)
        transforms.RandomHorizontalFlip(),  # Retourne horizontalement l'image aleatoirement (Data Augmentation pour varier les donnees)
        transforms.ToTensor(),  # Convertit l'image (pixels 0-255) en Tensor PyTorch (valeurs 0.0-1.0)
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalise les couleurs selon les stats ImageNet (aide le modele a converger)
    ])

    # Instancie le Dataset avec les chemins et les transformations definis plus haut
    print("Chargement du Dataset...")
    dataset = ISICDataset(csv_file=CSV_FILE, img_dir=IMG_DIR, transform=my_transforms)
    
    # --- Calcul automatique du poids pour gerer le desequilibre des classes ---
    df = pd.read_csv(CSV_FILE)  # Relit le CSV pour faire les statistiques
    neg = df['target'].value_counts()[0]  # Compte le nombre de cas benins (0)
    pos = df['target'].value_counts()[1]  # Compte le nombre de cas malins (1)
    # Calcule le ratio (ex: si 50 benins pour 1 malin, le poids sera 50)
    pos_weight = torch.tensor([neg / pos]).to(device) 
    print(f"Poids classe Malignant : {pos_weight.item():.2f}")  # Affiche le poids calcule

    # Cree le DataLoader qui va distribuer les donnees au modele
    train_loader = DataLoader(
        dataset=dataset,  # Le dataset source
        batch_size=BATCH_SIZE,  # La taille du paquet (16 images)
        shuffle=True,  # Melange les donnees a chaque epoque (tres important pour l'apprentissage)
        num_workers=NUM_WORKERS,  # Utilise 4 processus pour charger les donnees (vitesse)
        pin_memory=True  # Optimise le transfert de la RAM vers la VRAM du GPU
    )

    # --- Preparation du Modele ---
    # Telecharge EfficientNet-B0 avec les poids pre-entraines les plus recents
    model = models.efficientnet_b0(weights='DEFAULT') 
    # Remplace la derniere couche (classifier) pour avoir 1 seule sortie (Benin vs Malin) au lieu de 1000 (ImageNet)
    model.classifier[1] = Linear(model.classifier[1].in_features, 1)
    model = model.to(device)  # Envoie tout le modele sur la carte graphique (GPU)

    # Definit la fonction de perte (BCEWithLogitsLoss est ideale pour la classification binaire instable)
    # On lui passe pos_weight pour qu'elle penalise plus les erreurs sur les melanomes
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    # Definit l'optimiseur Adam (algorithme standard efficace) avec un learning rate de 0.0001
    optimizer = optim.Adam(model.parameters(), lr=1e-4)

    # --- 3. BOUCLE D'ENTRAINEMENT ---
    num_epochs = 5  # Definit le nombre de fois que le modele va voir toutes les images
    print("Demarrage de l'entrainement...")

    for epoch in range(num_epochs):  # Boucle sur les epoques (0 a 4)
        model.train()  # Met le modele en mode entrainement (active le Dropout et la BatchNorm)
        # Cree une barre de progression liee au train_loader
        loop = tqdm(train_loader, total=len(train_loader), leave=True) 
        running_loss = 0.0  # Initialise le compteur de perte pour cette epoque

        for images, labels in loop:  # Boucle sur chaque paquet (batch) d'images et de labels
            images = images.to(device)  # Envoie les images sur le GPU
            labels = labels.to(device).float().unsqueeze(1)  # Envoie les labels sur GPU et ajuste leur forme (Batch, 1)

            # --- Forward Pass (Prediction) ---
            outputs = model(images)  # Le modele fait une prediction sur les images
            loss = criterion(outputs, labels)  # Calcule l'erreur entre la prediction et la verite

            # --- Backward Pass (Apprentissage) ---
            optimizer.zero_grad()  # Remet a zero les gradients accumules precedemment (tres important !)
            loss.backward()  # Calcule les gradients (la direction dans laquelle modifier les poids)
            optimizer.step()  # Met a jour les poids du modele grace a l'optimiseur

            running_loss += loss.item()  # Ajoute la perte du batch au total
            
            # --- Mise a jour de l'affichage ---
            loop.set_description(f"Epoch [{epoch+1}/{num_epochs}]")  # Met a jour le texte de la barre (ex: Epoch 1/5)
            loop.set_postfix(loss=loss.item())  # Affiche la perte actuelle a droite de la barre

        # --- Sauvegarde ---
        # Sauvegarde les poids du modele dans un fichier .pth sur le disque dur
        torch.save(model.state_dict(), f"dermavision_epoch_{epoch+1}.pth")
        print(f"Epoch {epoch+1} terminee et sauvegardee.")  # Confirme la sauvegarde

# Point d'entree obligatoire pour Windows lors de l'utilisation du multiprocessing (num_workers > 0)
if __name__ == '__main__':
    main()  # Lance la fonction principalez