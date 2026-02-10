import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { useSites, type Site } from '../hooks/useSites';

interface SiteModalProps {
    onClose: () => void;
    site?: Site; // If provided, we are in Edit mode
}

export const SiteModal: React.FC<SiteModalProps> = ({ onClose, site }) => {
    const { addSite, updateSite } = useSites();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (site) {
            setName(site.name);
            setLocation(site.location);
        }
    }, [site]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        if (site) {
            await updateSite(site.id, name, location);
        } else {
            await addSite(name, location);
        }
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">{site ? 'Edit Site' : 'Add New Site'}</h3>
                        <p className="text-sm text-gray-500">{site ? 'Update site details' : 'Create a new construction site'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Site Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Downtown Plaza"
                            className="w-full text-lg p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Location / Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City or Street Address"
                                className="w-full text-lg p-3 pl-10 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
                        >
                            {loading ? 'Saving...' : (site ? 'Save Changes' : 'Create Site')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
