import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { HALT_CATEGORIES } from '../db';

interface StartHaltModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (data: { category: string; subcategory?: string }) => void;
}

export const StartHaltModal: React.FC<StartHaltModalProps> = ({ isOpen, onClose, onStart }) => {
    const [category, setCategory] = useState<string>(HALT_CATEGORIES[0]);
    const [subcategory, setSubcategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onStart({
            category,
            subcategory: subcategory || undefined
        });
        // Reset form
        setCategory(HALT_CATEGORIES[0]);
        setSubcategory('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scaleIn">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Start New Halt</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                        >
                            {HALT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Details (Optional)</label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            placeholder="e.g. Engine overheat, Heavy Rain"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Play size={24} fill="currentColor" />
                        Start Timer
                    </button>
                </form>
            </div>
        </div>
    );
};
