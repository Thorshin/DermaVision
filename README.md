# DermaVision

DermaVision est une application web intelligente capable d’analyser des images dermatologiques pour détecter automatiquement des pathologies cutanées, notamment le mélanome.

Ce projet utilise un modèle de Deep Learning (CNN EfficientNet) servi par une API FastAPI, avec une interface utilisateur moderne développée en React.

## Structure du Projet

- `backend/` : API Python (FastAPI) et logique de prédiction.
- `frontend/` : Interface utilisateur (React + Vite + Tailwind CSS).
- `dermavision_epoch_5.pth` : Le modèle entraîné (Poids).

## Prérequis

- Python 3.9+
- Node.js 18+
- GPU recommandé (mais fonctionne sur CPU)

## Installation et Lancement

### 1. Backend (API)

Ouvrez un terminal dans le dossier racine du projet :

```bash
cd backend
# Installer les dépendances (si nécessaire, assurez-vous d'avoir torch, torchvision, fastapi, uvicorn, pillow)
pip install torch torchvision fastapi uvicorn python-multipart pillow

# Lancer le serveur
uvicorn main:app --reload
```

Le serveur sera accessible sur `http://localhost:8000`.

### 2. Frontend (Interface)

Ouvrez un **nouveau** terminal dans le dossier racine :

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer l'interface de développement
npm run dev
```

L'application s'ouvrira généralement sur `http://localhost:5173`.

## Utilisation

1. Ouvrez l'interface web.
2. Glissez-déposez une image dermatologique ou cliquez pour en sélectionner une.
3. Cliquez sur "Lancer l'Analyse".
4. Le résultat s'affichera indiquant si la lésion semble bénigne ou maligne, avec un score de confiance.

> **Note** : Ce projet est une démonstration à visée éducative et d'aide à la recherche. Il ne remplace **pas** un diagnostic médical professionnel.