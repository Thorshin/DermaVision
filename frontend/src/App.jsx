import React, { useState } from 'react';
import axios from 'axios';
import ImageUpload from './components/ImageUpload';
import PredictionResult from './components/PredictionResult';
import { Sparkles } from 'lucide-react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use environment variable in production, but hardcode for local dev now
  const API_URL = "http://localhost:8000";

  const handleImageSelected = (file) => {
    setSelectedImage(file);
    setResult(null); // Reset previous result
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error analyzing image", error);
      alert("Erreur lors de l'analyse de l'image. Vérifiez que le backend est lancé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-accent/30">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">

        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6">
            <Sparkles className="w-6 h-6 text-accent mr-2" />
            <span className="font-bold text-xl tracking-tight text-slate-800">DermaVision</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Analyse Dermatologique <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-600">Intelligente</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Utilisez notre puissant modèle d'intelligence artificielle pour analyser vos grains de beauté et lésions cutanées en quelques secondes.
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto">
          {/* Card */}
          <div className="glass-card rounded-2xl p-8 md:p-10">
            <ImageUpload onImageSelected={handleImageSelected} />

            <div className="mt-8 flex justify-center">
              <button
                onClick={analyzeImage}
                disabled={!selectedImage || loading}
                className={`px-8 py-3 rounded-full font-semibold text-white shadow-lg shadow-accent/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${!selectedImage ? 'bg-slate-300' : 'bg-gradient-to-r from-accent to-blue-500 hover:shadow-xl'}`}
              >
                {loading ? "Traitement..." : "Lancer l'Analyse"}
              </button>
            </div>

            <PredictionResult result={result} loading={loading} />
          </div>
        </main>

        <footer className="text-center mt-20 text-slate-400 text-sm">
          <p>© 2025 DermaVision AI Project. Ceci est un outil d'aide, pas un médecin.</p>
        </footer>

      </div>
    </div>
  );
}

export default App;
