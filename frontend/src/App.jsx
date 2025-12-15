import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import PredictionResult from './components/PredictionResult';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// Main Analysis Component (Protected)
function Dashboard() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout, user } = useAuth(); // Assuming useAuth provides logout

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
      alert("Erreur lors de l'analyse. Vérifiez votre connexion ou reconnectez-vous.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-accent/30">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="font-bold text-lg text-slate-800">DermaVision</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Analyse <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-600">Intelligente</span>
          </h1>
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
      </div>
    </div>
  );
}

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Main App with Router
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
