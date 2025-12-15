import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUpload({ onImageSelected }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert("Veuillez sélectionner une image.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            onImageSelected(file);
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setPreview(null);
        onImageSelected(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode='wait'>
                {!preview ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="upload-zone"
                        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragActive ? "border-accent bg-accent/10" : "border-slate-300 bg-white hover:bg-slate-50"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={onButtonClick}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept="image/*"
                        />
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <div className="p-4 bg-slate-100 rounded-full mb-3">
                                <Upload className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="mb-2 text-sm text-slate-600">
                                <span className="font-semibold">Cliquez pour upload</span> ou glissez-déposez
                            </p>
                            <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key="preview-zone"
                        className="relative w-full h-64 rounded-lg overflow-hidden shadow-md bg-black"
                    >
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-sm transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
