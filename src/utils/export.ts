import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { TrainLog } from '../db';
import { format } from 'date-fns';

export const exportToExcel = async (logs: TrainLog[]) => {
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

    if (Capacitor.isNativePlatform()) {
        try {
            // Generate Base64 string
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

            // Write to Cache Directory
            const result = await Filesystem.writeFile({
                path: fileName,
                data: wbout,
                directory: Directory.Cache,
            });

            // Share the file
            await Share.share({
                title: 'Share Excel Log',
                text: 'Here is the train halt log.',
                url: result.uri,
                dialogTitle: 'Share Excel Log',
            });
        } catch (e) {
            console.error('Error sharing file', e);
            alert('Error sharing file: ' + JSON.stringify(e));
        }
    } else {
        // Web Fallback
        XLSX.writeFile(wb, fileName);
    }
};
