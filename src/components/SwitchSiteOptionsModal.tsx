import React, { useState } from 'react';
import { Users, UserPlus, UserX, X } from 'lucide-react';
import type { Site } from '../hooks/useSites';

export type SwitchOption = 'limit-current' | 'add-new' | 'solo' | 'cancel';

interface SwitchSiteOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetSite: Site;
    currentPartners: { displayName: string }[];
    onOptionSelect: (option: SwitchOption, extraData?: string) => void;
}

export const SwitchSiteOptionsModal: React.FC<SwitchSiteOptionsModalProps> = ({
    isOpen,
    onClose,
    targetSite,
    currentPartners,
    onOptionSelect
}) => {
    const [step, setStep] = useState<'options' | 'input'>('options');
    const [newUsername, setNewUsername] = useState('');

    if (!isOpen) return null;

    const handleOptionClick = (option: SwitchOption) => {
        if (option === 'add-new') {
            setStep('input');
        } else {
            onOptionSelect(option);
            onClose();
        }
    };

    const handleNewUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUsername.trim()) {
            onOptionSelect('add-new', newUsername.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-white/20">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-900">Switching to "{targetSite.name}"</h3>
                        <p className="text-xs text-gray-500">How should we handle current sync?</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    {step === 'options' ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleOptionClick('limit-current')}
                                className="w-full text-left p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Update Current Sync</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Move {currentPartners.length > 0 ? currentPartners[0].displayName : 'partners'} to this site.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleOptionClick('add-new')}
                                className="w-full text-left p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                                        <UserPlus size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Sync with New User</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Keep current sync active on old site. Start fresh here.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleOptionClick('solo')}
                                className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-200 text-gray-600 p-2 rounded-lg group-hover:bg-gray-300 transition-colors">
                                        <UserX size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">No Sync (Solo)</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Switch to "{targetSite.name}" in private mode.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleNewUserSubmit} className="space-y-4 animate-in slide-in-from-right-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Partner Username
                                </label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username to invite"
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-500 focus:bg-white outline-none transition-all"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('options')}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Invite & Switch
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
