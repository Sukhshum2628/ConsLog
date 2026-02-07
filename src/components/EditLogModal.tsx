import React, { useState, useEffect } from 'react';
import type { TrainLog } from '../db';
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

    useEffect(() => {
        if (log) {
            setArrivalStr(format(log.arrival_timestamp, 'HH:mm'));
            if (log.departure_timestamp) {
                setDepartureStr(format(log.departure_timestamp, 'HH:mm'));
            } else {
                setDepartureStr('');
            }
        }
    }, [log]);

    const handleSave = () => {
        try {
            const updatedLog = { ...log };

            // Update Arrival
            if (arrivalStr) {
                const [h, m] = arrivalStr.split(':').map(Number);
                const base = new Date(log.arrival_timestamp);
                const newDate = set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
                updatedLog.arrival_timestamp = newDate.getTime();
            }

            // Update Departure
            if (departureStr) {
                const [h, m] = departureStr.split(':').map(Number);
                const base = log.departure_timestamp ? new Date(log.departure_timestamp) : new Date(log.arrival_timestamp);
                const newDate = set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
                updatedLog.departure_timestamp = newDate.getTime();
            } else {
                // If cleared, maybe we should remove it? For now, let's keep it simple and assume valid input
                // Or if it was running, departure is undefined. 
                // If user clears departure of a completed log, it becomes running? 
                // Let's assume user only edits valid times for now. 
            }

            onSave(updatedLog);
            onClose();
        } catch (e) {
            alert('Invalid time format');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Edit Log Entry</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">Arrival Time</label>
                        <input
                            type="time"
                            value={arrivalStr}
                            onChange={(e) => setArrivalStr(e.target.value)}
                            className="w-full text-2xl font-mono p-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">Departure Time</label>
                        <input
                            type="time"
                            value={departureStr}
                            onChange={(e) => setDepartureStr(e.target.value)}
                            disabled={log.status === 'RUNNING'}
                            className={`
                                w-full text-2xl font-mono p-3 rounded-xl border-2 border-transparent outline-none transition-all
                                ${log.status === 'RUNNING'
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 focus:border-blue-500 focus:bg-white'}
                            `}
                        />
                        {log.status === 'RUNNING' && (
                            <p className="text-xs text-orange-500 mt-2 font-medium">
                                Cannot edit departure while train is running.
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
