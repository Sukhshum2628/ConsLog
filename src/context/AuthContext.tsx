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
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    sendVerification: () => Promise<void>;
    setUserPassword: (pass: string) => Promise<void>;
    linkIdentity: (provider: 'google') => Promise<void>;
    unlinkIdentity: (providerId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                const result = await FirebaseAuthentication.signInWithGoogle({
                    mode: 'redirect', // Optional, but can help
                    scopes: ['email', 'profile']
                });
                const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                await signInWithCredential(auth, credential);
            }
        } catch (error: any) {
            console.error("Google Sign-In Failed:", error);
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

    const linkIdentity = async (providerName: 'google' | 'microsoft') => {
        if (!auth.currentUser) return;

        try {
            const { linkWithCredential, OAuthProvider, GoogleAuthProvider } = await import('firebase/auth');

            let credential;

            if (Capacitor.getPlatform() === 'web') {
                // Web Linking
                const { linkWithPopup } = await import('firebase/auth');
                if (providerName === 'google') {
                    const provider = new GoogleAuthProvider();
                    await linkWithPopup(auth.currentUser, provider);
                } else {
                    const { microsoftProvider } = await import('../lib/firebase');
                    await linkWithPopup(auth.currentUser, microsoftProvider);
                }
                alert("Account Linked Successfully!");
                return;
            }

            // Native Linking
            if (providerName === 'google') {
                const result = await FirebaseAuthentication.signInWithGoogle();
                credential = GoogleAuthProvider.credential(result.credential?.idToken);
            } else {
                const result = await FirebaseAuthentication.signInWithMicrosoft();
                if (result.credential) {
                    const provider = new OAuthProvider('microsoft.com');
                    credential = provider.credential({
                        idToken: result.credential.idToken,
                        accessToken: result.credential.accessToken
                    });
                }
            }

            if (credential) {
                await linkWithCredential(auth.currentUser, credential);
                alert("Account Linked Successfully!");
            }

        } catch (error: any) {
            console.error("Link Identity Failed:", error);
            // Alert handled by caller or here
            if (Capacitor.getPlatform() !== 'web') {
                alert(`Link Failed: ${error.message}`);
            }
            throw error;
        }
    };

    const unlinkIdentity = async (providerId: string) => {
        if (!auth.currentUser) return;
        try {
            const { unlink } = await import('firebase/auth');
            await unlink(auth.currentUser, providerId);
            alert("Account Unlinked Successfully!");
        } catch (error: any) {
            console.error("Unlink Failed:", error);
            alert(`Unlink Failed: ${error.message}`);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            if (Capacitor.getPlatform() !== 'web') {
                await FirebaseAuthentication.signOut();
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
            signInWithEmail,
            signUpWithEmail,
            logout,
            sendVerification,
            setUserPassword,
            linkIdentity,
            unlinkIdentity
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
