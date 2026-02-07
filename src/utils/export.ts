import * as XLSX from 'xlsx';
import type { TrainLog } from '../db';
import { format } from 'date-fns';

export const exportToExcel = (logs: TrainLog[]) => {
    const data = logs.map((log) => ({
        Date: log.date,
        'Arrival Time': format(log.arrival_timestamp, 'HH:mm:ss'),
        'Departure Time': log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm:ss') : '--',
        'Halt Duration': log.halt_duration_seconds
            ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
            : 'RUNNING',
    }));

    const totalHaltSeconds = logs.reduce((acc, curr) => acc + (curr.halt_duration_seconds || 0), 0);
    const totalHaltFormatted = new Date(totalHaltSeconds * 1000).toISOString().substr(11, 8);

    data.push({
        Date: '',
        'Arrival Time': '',
        'Departure Time': 'TOTAL HALT TIME:',
        'Halt Duration': totalHaltFormatted,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TrainLogs');

    const fileName = `TrainLogs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
