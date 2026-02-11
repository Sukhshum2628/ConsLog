import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Briefcase } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import type { Shift } from '../db';
import { ShiftService } from '../services/shiftService';
import { useAuth } from '../context/AuthContext';

interface ShiftManagerProps {
    isOpen: boolean;
    onClose: () => void;
    siteId: string;
    siteName: string;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({ isOpen, onClose, siteId, siteName }) => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    // New Shift State
    const [newShiftName, setNewShiftName] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isOpen && user && siteId) {
            loadShifts();
        }
    }, [isOpen, user, siteId]);

    const loadShifts = async () => {
        setLoading(true);
        if (!user) return;
        try {
            // Use the new service
            const fetched = await ShiftService.getShiftsBySite(user.uid, siteId);
            setShifts(fetched);
        } catch (e) {
            console.error(e);
            showAlert({ title: 'Error', message: 'Failed to load shifts', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddShift = async () => {
        if (!newShiftName.trim()) {
            showAlert({ title: 'Missing Name', message: 'Please enter a shift name (e.g. "Day Shift")', type: 'warning' });
            return;
        }
        if (!user) return;

        try {
            const newShift: Omit<Shift, 'id'> = {
                name: newShiftName.trim(),
                startTime,
                endTime,
                siteId
            };

            await ShiftService.createShift(newShift, user.uid);

            // Reset and Reload
            setNewShiftName('');
            setIsAdding(false);
            loadShifts();
            showAlert({ title: 'Success', message: 'Shift added successfully', type: 'success' });
        } catch (e) {
            console.error(e);
            showAlert({ title: 'Error', message: 'Failed to add shift', type: 'danger' });
        }
    };

    const handleDeleteShift = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Shift?',
            message: 'Are you sure you want to delete this shift?',
            type: 'warning'
        });

        if (confirmed && user) {
            try {
                await ShiftService.deleteShift(id, user.uid);
                loadShifts();
            } catch (e) {
                console.error(e);
                showAlert({ title: 'Error', message: 'Failed to delete shift', type: 'danger' });
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase size={20} className="text-blue-600" />
                            Manage Shifts
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">For {siteName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 transform duration-200 hover:scale-110 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading shifts...</div>
                    ) : shifts.length === 0 && !isAdding ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">No shifts defined yet.</p>
                            <p className="text-xs text-gray-400">Add shifts to auto-tag your logs.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {shifts.map(shift => (
                                <div key={shift.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                            {shift.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{shift.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={10} />
                                                {shift.startTime} - {shift.endTime}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteShift(shift.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Form */}
                    {isAdding ? (
                        <div className="p-4 bg-gray-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">New Shift Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shift Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Day Shift"
                                        value={newShiftName}
                                        onChange={e => setNewShiftName(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Start Time</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">End Time</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-2 text-gray-500 font-medium hover:bg-gray-200 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddShift}
                                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm text-sm"
                                >
                                    Save Shift
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Add New Shift
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
