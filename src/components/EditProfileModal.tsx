import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Building, Phone, Save, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [designation, setDesignation] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadProfile();
        }
    }, [isOpen, user]);

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setUsername(data.username || '');
                setDisplayName(data.displayName || user.displayName || '');
                setDesignation(data.designation || '');
                setCompany(data.company || '');
                setPhone(data.phone || '');
            } else {
                setDisplayName(user.displayName || '');
            }
        } catch (e) {
            console.error("Profile Load Error", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setSuccess('');
        setSaving(true);

        try {
            // 1. Check Username Uniqueness (if changed)
            if (username) {
                // Ideally we check if username exists for OTHER users
                const q = query(collection(db, 'users'), where('username', '==', username));
                const snap = await getDocs(q);
                const isTaken = snap.docs.some(d => d.id !== user.uid);
                if (isTaken) {
                    throw new Error("Username is already taken. Please choose another.");
                }
            }

            // 2. Save
            await setDoc(doc(db, 'users', user.uid), {
                username,
                displayName,
                designation,
                company,
                phone,
                email: user.email,
                updatedAt: new Date()
            }, { merge: true });

            setSuccess("Profile updated successfully!");
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 1000); // Close after 1s
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scale-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 font-medium">
                            {success}
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Username (Unique)</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                placeholder="john.doe"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">Used for syncing with others.</p>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                required
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    {/* Designation */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Designation</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={designation}
                                onChange={e => setDesignation(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Site Engineer"
                            />
                        </div>
                    </div>

                    {/* Company */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Company</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Acme Construction"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>
                </form>

                <div className="p-4 bg-gray-50 border-t">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><Save size={20} /> Save Profile</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
