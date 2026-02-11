import React, { useState, useEffect } from 'react';
import { X, Play, Clock } from 'lucide-react';
import { HALT_CATEGORIES, type Shift } from '../db';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { ShiftService } from '../services/shiftService';

interface StartHaltModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (data: { category: string; subcategory?: string; shiftId?: string; shiftName?: string }) => void;
}

export const StartHaltModal: React.FC<StartHaltModalProps> = ({ isOpen, onClose, onStart }) => {
    const { user } = useAuth();
    const { selectedSite } = useSites();
    const [category, setCategory] = useState<string>(HALT_CATEGORIES[0]);
    const [subcategory, setSubcategory] = useState('');

    // Shift State
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [selectedShiftId, setSelectedShiftId] = useState<string>('');

    // Load shifts when modal opens
    useEffect(() => {
        if (isOpen && user && selectedSite) {
            ShiftService.getShiftsBySite(user.uid, selectedSite.id)
                .then(fetched => {
                    setShifts(fetched);
                    // Auto-select current shift
                    const current = ShiftService.getCurrentShift(fetched);
                    if (current) {
                        setSelectedShiftId(current.id);
                    } else if (fetched.length > 0) {
                        // Optional: Select first or none?
                        // Let's select none but maybe user wants to force one.
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isOpen, user, selectedSite]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedShift = shifts.find(s => s.id === selectedShiftId);

        onStart({
            category,
            subcategory: subcategory || undefined,
            shiftId: selectedShiftId || undefined,
            shiftName: selectedShift?.name
        });
        // Reset form
        setCategory(HALT_CATEGORIES[0]);
        setSubcategory('');
        setSelectedShiftId('');
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
                    {/* Shift Selector (Only if shifts exist) */}
                    {shifts.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                <Clock size={12} /> Shift
                            </label>
                            <select
                                value={selectedShiftId}
                                onChange={(e) => setSelectedShiftId(e.target.value)}
                                className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none font-medium text-blue-900"
                            >
                                <option value="">-- No Shift --</option>
                                {shifts.map((shift) => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
