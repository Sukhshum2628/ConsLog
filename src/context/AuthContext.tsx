import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type User,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updatePassword
} from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithMicrosoft: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    sendVerification: () => Promise<void>;
    setUserPassword: (pass: string) => Promise<void>;
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

    const signInWithGoogle = async () => {
        try {
            if (Capacitor.getPlatform() === 'web') {
                // Web fallback
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            } else {
                // Native Login
                const googleUser = await GoogleAuth.signIn();
                const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
                await signInWithCredential(auth, credential);
            }
        } catch (error: any) {
            console.error("Google Sign-In Failed:", error);
            throw error;
        }
    };

    const signInWithMicrosoft = async () => {
        try {
            const { microsoftProvider } = await import('../lib/firebase');
            await signInWithPopup(auth, microsoftProvider);
        } catch (error: any) {
            console.error("Microsoft Sign-In Failed:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // Automatically send verification email on sign up
        await sendEmailVerification(userCredential.user);
    };

    const sendVerification = async () => {
        if (user) {
            await sendEmailVerification(user);
        }
    };

    const setUserPassword = async (pass: string) => {
        if (user) {
            await updatePassword(user, pass);
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
        <AuthContext.Provider value={{
            user,
            loading,
            signInWithGoogle,
            signInWithMicrosoft,
            signInWithEmail,
            signUpWithEmail,
            logout,
            sendVerification,
            setUserPassword
        }}>
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
