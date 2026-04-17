import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

function getUserFromToken(storedToken) {
    if (!storedToken) return null;
    try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) return null;
        return { email: decoded.sub };
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const storedToken = localStorage.getItem("token");
    const [user, setUser] = useState(() => getUserFromToken(storedToken));
    const [token, setToken] = useState(storedToken);
    const navigate = useNavigate();

    const API_URL = "http://localhost:8000";

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({ email: decoded.sub });
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        try {
            const res = await axios.post(`${API_URL}/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const newToken = res.data.access_token;
            const decoded = jwtDecode(newToken);
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser({ email: decoded.sub });
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            navigate("/");
            return { success: true };
        } catch (e) {
            console.error("Login failed", e);
            return { success: false, error: e.response?.data?.detail || "Erreur de connexion" };
        }
    };

    const register = async (email, password) => {
        try {
            await axios.post(`${API_URL}/register`, { email, password });
            return await login(email, password);
        } catch (e) {
            console.error("Registration failed", e);
            return { success: false, error: e.response?.data?.detail || "Erreur d'inscription" };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
