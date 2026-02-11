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
    const { user, linkIdentity } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [linking, setLinking] = useState(false);

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

    const handleLink = async (provider: 'google') => {
        if (!linkIdentity) return;
        setLinking(true);
        try {
            await linkIdentity(provider);
        } catch (e) {
            // Error handled in AuthContext
        } finally {
            setLinking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scale-up max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-grow">
                    <form id="profile-form" onSubmit={handleSave} className="p-4 space-y-4">
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

                    {/* Manage Accounts Section - Scrollable Area */}
                    <div className="px-4 pb-4">
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-semibold text-gray-900">Manage Accounts</h3>
                            <div className="space-y-3">
                                {/* Google Account */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                                <path d="M12.24 24.0008C15.4765 24.0008 18.2058 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853" />
                                                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61482H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                                <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-700">Google</span>
                                    </div>
                                    {user?.providerData.some(p => p.providerId === 'google.com') ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Connected</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleLink('google')}
                                            disabled={linking}
                                            className="px-3 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex-shrink-0">
                    <button
                        form="profile-form"
                        type="submit"
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
