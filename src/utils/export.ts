import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { TrainLog } from '../db';

export const exportToPDF = async (logs: TrainLog[], fileName: string = `TimeLog_${format(new Date(), 'yyyy-MM-dd')}`) => {
    try {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('TimeLog Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30);

        // Table Data
        const tableData = logs.map(log => [
            format(log.arrival_timestamp, 'HH:mm'),
            log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm') : '--',
            log.halt_duration_seconds ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8) : 'RUNNING'
        ]);

        autoTable(doc, {
            head: [['Arrival', 'Departure', 'Halt Duration']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const pdfOutput = doc.output('datauristring');
        // Remove prefix "data:application/pdf;filename=generated.pdf;base64,"
        const base64Data = pdfOutput.split(',')[1];

        if (Capacitor.isNativePlatform()) {
            const savedFile = await Filesystem.writeFile({
                path: `${fileName}.pdf`,
                data: base64Data,
                directory: Directory.Documents,
            });

            await Share.share({
                title: 'TimeLog Export',
                text: 'Here is your TimeLog PDF report.',
                url: savedFile.uri,
                dialogTitle: 'Share PDF',
            });
        } else {
            // Web Fallback
            doc.save(`${fileName}.pdf`);
        }

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Failed to export PDF');
    }
};

export const exportToExcel = async (logs: TrainLog[], fileName: string = `TimeLog_${format(new Date(), 'yyyy-MM-dd')}`) => {
    try {
        // 1. Prepare Data
        const data = logs.map(log => ({
            'Arrival Time': format(log.arrival_timestamp, 'HH:mm:ss'),
            'Departure Time': log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm:ss') : '--',
            'Halt Duration': log.halt_duration_seconds
                ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
                : 'RUNNING',
            'Date': format(log.arrival_timestamp, 'yyyy-MM-dd'),
            'Status': log.status
        }));

        // 2. Create Workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Logs");

        // 3. Write Buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        // 4. Save/Share
        if (Capacitor.isNativePlatform()) {
            const savedFile = await Filesystem.writeFile({
                path: `${fileName}.xlsx`,
                data: wbout,
                directory: Directory.Documents,
            });

            await Share.share({
                title: 'TimeLog Export',
                text: 'Here is your TimeLog Excel export.',
                url: savedFile.uri,
                dialogTitle: 'Share Excel',
            });
        } else {
            // Web Fallback
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        }
    } catch (e) {
        console.error("Export failed", e);
        alert("Export failed. Please try again.");
    }
};
