import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize Google Auth Plugin for Web/Native
        if (Capacitor.getPlatform() !== 'web') {
            GoogleAuth.initialize();
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            if (Capacitor.getPlatform() === 'web') {
                // Web fallback
                await signInWithPopup(auth, googleProvider);
            } else {
                // Native Login
                const googleUser = await GoogleAuth.signIn();
                // Create credential for Firebase
                const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
                await signInWithCredential(auth, credential);
            }
        } catch (error) {
            console.error("Login Failed", error);
            alert("Login failed. Please try again.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            if (Capacitor.getPlatform() !== 'web') {
                await GoogleAuth.signOut();
            }
        } catch (error) {
            console.error("Logout Failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
