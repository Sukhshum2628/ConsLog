import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Briefcase } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import type { Shift } from '../db';
import { ShiftService } from '../services/shiftService';
import { useAuth } from '../context/AuthContext';

interface InlineShiftManagerProps {
    siteId: string;
}

export const InlineShiftManager: React.FC<InlineShiftManagerProps> = ({ siteId }) => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    const [newShiftName, setNewShiftName] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (user && siteId) {
            loadShifts();
        }
    }, [user, siteId]);

    const loadShifts = async () => {
        setLoading(true);
        if (!user) return;
        try {
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
            showAlert({ title: 'Missing Name', message: 'Please enter a shift name', type: 'warning' });
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
            setNewShiftName('');
            setIsAdding(false);
            loadShifts();
        } catch (e) {
            console.error(e);
            showAlert({ title: 'Error', message: 'Failed to add shift', type: 'danger' });
        }
    };

    const handleDeleteShift = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Shift?',
            message: 'Are you sure?',
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-t pt-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    Site Shifts
                </h3>
            </div>
            {loading ? (
                <div className="text-center py-4 text-gray-400 text-xs">Loading shifts...</div>
            ) : shifts.length === 0 && !isAdding ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-xs font-medium">No shifts defined.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {shifts.map(shift => (
                        <div key={shift.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                    {shift.name.substring(0, 2)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 leading-tight">{shift.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium">{shift.startTime} - {shift.endTime}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {isAdding ? (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Shift Name (e.g. Day)"
                        value={newShiftName}
                        onChange={e => setNewShiftName(e.target.value)}
                        className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 outline-none" />
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleAddShift} className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md">Add</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full py-2 bg-gray-50 border border-dashed border-gray-300 text-gray-500 text-xs font-bold rounded-lg hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Shift
                </button>
            )}
        </div>
    );
};

interface ShiftManagerProps {
    isOpen: boolean;
    onClose: () => void;
    siteId: string;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({ isOpen, onClose, siteId }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase size={20} className="text-blue-600" />
                            Manage Shifts
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <InlineShiftManager siteId={siteId} />
                </div>
            </div>
        </div>
    );
};
