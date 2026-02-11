import React, { useState, useEffect } from 'react';
import { type TrainLog, HALT_CATEGORIES } from '../db';
import { format, set } from 'date-fns';
import { X, Save } from 'lucide-react';

interface EditLogModalProps {
    log: TrainLog;
    onClose: () => void;
    onSave: (updatedLog: TrainLog) => void;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({ log, onClose, onSave }) => {
    const [arrivalStr, setArrivalStr] = useState('');
    const [departureStr, setDepartureStr] = useState('');
    const [category, setCategory] = useState<string>('');
    const [subcategory, setSubcategory] = useState<string>('');

    useEffect(() => {
        if (log) {
            setArrivalStr(format(log.arrival_timestamp, 'HH:mm:ss'));
            if (log.departure_timestamp) {
                setDepartureStr(format(log.departure_timestamp, 'HH:mm:ss'));
            } else {
                setDepartureStr('');
            }
            setCategory(log.category || HALT_CATEGORIES[0]);
            setSubcategory(log.subcategory || '');
        }
    }, [log]);

    const handleSave = () => {
        try {
            const updatedLog = {
                ...log,
                category,
                subcategory: subcategory || undefined
            };

            // Update Arrival
            if (arrivalStr) {
                const parts = arrivalStr.split(':').map(Number);
                const h = parts[0];
                const m = parts[1];
                const s = parts[2] || 0;

                const base = new Date(log.arrival_timestamp);
                const newDate = set(base, { hours: h, minutes: m, seconds: s, milliseconds: 0 });
                updatedLog.arrival_timestamp = newDate.getTime();
            }

            // Update Departure
            if (departureStr) {
                const parts = departureStr.split(':').map(Number);
                const h = parts[0];
                const m = parts[1];
                const s = parts[2] || 0;

                const base = log.departure_timestamp ? new Date(log.departure_timestamp) : new Date(log.arrival_timestamp);
                const newDate = set(base, { hours: h, minutes: m, seconds: s, milliseconds: 0 });
                updatedLog.departure_timestamp = newDate.getTime();
            }

            // Recalculate Duration
            if (updatedLog.arrival_timestamp && updatedLog.departure_timestamp) {
                if (updatedLog.departure_timestamp < updatedLog.arrival_timestamp) {
                    alert('End time cannot be before Start time.');
                    return;
                }
                updatedLog.halt_duration_seconds = Math.floor((updatedLog.departure_timestamp - updatedLog.arrival_timestamp) / 1000);
            }

            onSave(updatedLog);
            onClose();
        } catch (e) {
            alert('Invalid time format');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scaleIn border border-white/20">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">Edit Entry</h3>
                        <p className="text-sm text-gray-500">Adjust details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none font-medium text-gray-800"
                            >
                                {HALT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Subcategory / Note</label>
                            <input
                                type="text"
                                value={subcategory}
                                onChange={(e) => setSubcategory(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-800"
                                placeholder="Optional details..."
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Arrival Time</label>
                        <input
                            type="time"
                            step="1"
                            value={arrivalStr}
                            onChange={(e) => setArrivalStr(e.target.value)}
                            className="w-full text-3xl font-mono font-bold p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Departure Time</label>
                        <input
                            type="time"
                            step="1"
                            value={departureStr}
                            onChange={(e) => setDepartureStr(e.target.value)}
                            disabled={log.status === 'RUNNING'}
                            className={`
                                w-full text-3xl font-mono font-bold p-4 rounded-2xl border-2 border-transparent outline-none transition-all
                                ${log.status === 'RUNNING'
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-50 text-gray-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'}
                            `}
                        />
                        {log.status === 'RUNNING' && (
                            <div className="flex items-center gap-2 mt-2 text-orange-600 bg-orange-50 p-2 rounded-lg text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Cannot edit departure while currently running
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
