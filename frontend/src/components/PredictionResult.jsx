import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function PredictionResult({ result, loading }) {
    if (loading) {
        return (
            <div className="mt-8 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-slate-500 text-sm">Analyse en cours...</p>
            </div>
        )
    }

    if (!result) return null;

    const isMalignant = result.is_malignant;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 p-6 rounded-xl border ${isMalignant ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'} shadow-sm`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${isMalignant ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {isMalignant ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isMalignant ? 'text-red-700' : 'text-green-700'}`}>
                        {result.label}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Confiance IA:</span>
                        <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isMalignant ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${(result.probability * 100).toFixed(0)}%` }}
                            ></div>
                        </div>
                        <span className="text-sm text-slate-700 font-mono">{(result.probability * 100).toFixed(2)}%</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                        {isMalignant
                            ? "Le modèle a détecté des caractéristiques potentiellement malignes. Veuillez consulter un dermatologue immédiatement."
                            : "Le modèle n'a pas détecté de signes suspects majeurs. Restez vigilant et consultez un médecin en cas de doute."
                        }
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
