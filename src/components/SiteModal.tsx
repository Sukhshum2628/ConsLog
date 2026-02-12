import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { useSyncActions } from '../hooks/useSyncActions';

interface SiteModalProps {
    onClose: () => void;
    site?: Site; // If provided, we are in Edit mode
}

export const SiteModal: React.FC<SiteModalProps> = ({ onClose, site }) => {
    const { addSite, updateSite } = useSites();
    const { sendRequest } = useSyncActions();

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);

    const [showInvite, setShowInvite] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');

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
            const newSiteId = await addSite(name, location);
            if (newSiteId && showInvite && inviteUsername.trim()) {
                await sendRequest(inviteUsername.trim(), newSiteId, name);
            }
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

                    {!site && (
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showInvite}
                                    onChange={(e) => setShowInvite(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-bold text-gray-700">Invite Partner?</span>
                            </label>

                            {showInvite && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={inviteUsername}
                                        onChange={(e) => setInviteUsername(e.target.value)}
                                        placeholder="Partner Username"
                                        className="w-full text-sm p-3 bg-purple-50 rounded-xl border border-purple-100 focus:border-purple-500 focus:bg-white outline-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">They will receive a request to sync this site.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-2">
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
