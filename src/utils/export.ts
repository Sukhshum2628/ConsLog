import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { TrainLog } from '../db';

export interface ExportProfile {
    displayName?: string;
    company?: string;
    designation?: string;
}

export interface ExportLog extends TrainLog {
    owner?: string;
}

export const exportToPDF = async (logs: ExportLog[], profile?: ExportProfile, fileName: string = `TimeLog_${format(new Date(), 'yyyy-MM-dd')}`) => {
    try {
        const doc = new jsPDF();

        // 1. Header Section
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('TimeLog Report', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 30);

        // 2. Profile Info
        if (profile) {
            const rightMargin = 196;
            doc.setFontSize(12);
            doc.text(profile.displayName || 'User', rightMargin, 15, { align: 'right' });
            if (profile.designation) {
                doc.setFontSize(10);
                doc.text(profile.designation, rightMargin, 22, { align: 'right' });
            }
            if (profile.company) {
                doc.setFontSize(10);
                doc.text(profile.company, rightMargin, 29, { align: 'right' });
            }
        }

        // 3. Group Logs by Owner
        const groupedLogs: Record<string, ExportLog[]> = {};
        logs.forEach(log => {
            const owner = log.owner || 'My Logs';
            if (!groupedLogs[owner]) groupedLogs[owner] = [];
            groupedLogs[owner].push(log);
        });

        let currentY = 50;

        // 4. Iterate Groups
        Object.keys(groupedLogs).forEach(owner => {
            const ownerLogs = groupedLogs[owner];

            // Calculate User Total
            const userTotalSeconds = ownerLogs.reduce((sum, l) => sum + (l.halt_duration_seconds || 0), 0);
            const userTotalFormatted = new Date(userTotalSeconds * 1000).toISOString().substr(11, 8);

            // Group Header
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185);
            doc.text(`${owner} (Total Halt: ${userTotalFormatted})`, 14, currentY);
            currentY += 5;

            const tableData = ownerLogs.map(log => [
                format(log.arrival_timestamp, 'HH:mm'),
                log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm') : '--',
                log.halt_duration_seconds ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8) : 'RUNNING'
            ]);

            autoTable(doc, {
                head: [['Arrival', 'Departure', 'Halt Duration']],
                body: tableData,
                startY: currentY,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { bottom: 10 }
            });

            // Update Y for next table (autoTable exposes finalY)
            currentY = (doc as any).lastAutoTable.finalY + 15;

            // Page break check if needed (autoTable handles it mostly, but title logic might overlap)
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }
        });

        // 5. Grand Total Footer
        const grandTotalSeconds = logs.reduce((sum, l) => sum + (l.halt_duration_seconds || 0), 0);
        const grandTotalFormatted = new Date(grandTotalSeconds * 1000).toISOString().substr(11, 8);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`GRAND TOTAL HALT TIME: ${grandTotalFormatted}`, 14, currentY);

        const pdfOutput = doc.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];

        if (Capacitor.isNativePlatform()) {
            const savedFile = await Filesystem.writeFile({
                path: `${fileName}.pdf`,
                data: base64Data,
                directory: Directory.Documents,
            });

            await Share.share({
                title: 'TimeLog Export',
                text: `Here is the TimeLog report for ${format(new Date(), 'PPP')}`,
                url: savedFile.uri,
                dialogTitle: 'Share PDF',
            });
        } else {
            doc.save(`${fileName}.pdf`);
        }

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Failed to export PDF: ' + (error as any).message);
    }
};

export const exportToExcel = async (logs: ExportLog[], fileName: string = `TimeLog_${format(new Date(), 'yyyy-MM-dd')}`) => {
    try {
        // 1. Prepare Data
        const data = logs.map(log => ({
            'User': log.owner || 'Me',
            'Arrival Time': format(log.arrival_timestamp, 'HH:mm:ss'),
            'Departure Time': log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm:ss') : '--',
            'Halt Duration': log.halt_duration_seconds
                ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
                : 'RUNNING',
            'Date': format(log.arrival_timestamp, 'yyyy-MM-dd'),
            'Status': log.status
        }));

        // Add Total Row
        const grandTotalSeconds = logs.reduce((sum, l) => sum + (l.halt_duration_seconds || 0), 0);
        const grandTotalFormatted = new Date(grandTotalSeconds * 1000).toISOString().substr(11, 8);

        data.push({
            'User': 'GRAND TOTAL',
            'Arrival Time': '',
            'Departure Time': '',
            'Halt Duration': grandTotalFormatted,
            'Date': '',
            'Status': ''
        } as any);

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
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        }
    } catch (e) {
        console.error("Export failed", e);
        alert("Export failed. Please try again.");
    }
};
