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
    siteName?: string;
}

export const exportToPDF = async (logs: ExportLog[], profile?: ExportProfile, fileName: string = `TimeLog_${format(new Date(), 'yyyy-MM-dd')}`) => {
    try {
        const doc = new jsPDF();

        // 1. Header Section
        doc.setFillColor(41, 128, 185);
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

        // 3. Group Logs by User AND Date
        const groupedLogs: Record<string, ExportLog[]> = {};
        logs.forEach(log => {
            const dateStr = format(new Date(log.arrival_timestamp), 'yyyy-MM-dd');
            const owner = log.owner || 'My Logs';
            const groupKey = `${owner} (${dateStr})`;
            if (!groupedLogs[groupKey]) groupedLogs[groupKey] = [];
            groupedLogs[groupKey].push(log);
        });

        let currentY = 50;

        // 4. Iterate Groups
        Object.keys(groupedLogs).sort().forEach(groupKey => {
            const groupLogs = groupedLogs[groupKey];

            // Calculate Group Total
            const groupTotalSeconds = groupLogs.reduce((sum, l) => sum + (l.halt_duration_seconds || 0), 0);
            const groupTotalFormatted = new Date(groupTotalSeconds * 1000).toISOString().substr(11, 8);

            // Group Header
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.setFont('helvetica', 'bold');
            doc.text(`${groupKey} - Total: ${groupTotalFormatted}`, 14, currentY);
            currentY += 6;

            const tableData = groupLogs.map(log => [
                format(log.arrival_timestamp, 'HH:mm'),
                log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm') : '--', // Departure
                log.halt_duration_seconds ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8) : 'RUNNING', // Duration
                `${log.category}${log.subcategory ? ` - ${log.subcategory}` : ''}`, // Cause
                log.siteName || log.siteId || '-' // Site
            ]);

            autoTable(doc, {
                head: [['Start', 'End', 'Duration', 'Cause', 'Site']],
                body: tableData,
                startY: currentY,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 'auto' }, // Cause gets methods
                    4: { cellWidth: 30 }
                },
                margin: { bottom: 10 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        });

        // 5. Grand Total (Effective) Logic
        const calculateEffectiveGrandTotal = (allLogs: ExportLog[]) => {
            const uniqueEventGroups: Record<string, number> = {};
            allLogs.forEach(log => {
                const siteId = log.siteId || 'legacy_no_site';
                const startTime = log.arrival_timestamp;
                const key = `${siteId}_${startTime}`;
                const halt = log.halt_duration_seconds || 0;
                if (!uniqueEventGroups[key] || halt > uniqueEventGroups[key]) {
                    uniqueEventGroups[key] = halt;
                }
            });
            return Object.values(uniqueEventGroups).reduce((sum, val) => sum + val, 0);
        };

        const grandTotalSeconds = calculateEffectiveGrandTotal(logs);
        const grandTotalFormatted = new Date(grandTotalSeconds * 1000).toISOString().substr(11, 8);

        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`GRAND TOTAL (Effective): ${grandTotalFormatted}`, 14, currentY);

        const pdfOutput = doc.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];

        if (Capacitor.isNativePlatform()) {
            const savedFile = await Filesystem.writeFile({
                path: `${fileName}.pdf`,
                data: base64Data,
                directory: Directory.Cache,
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
        const data: any[] = logs.map(log => ({
            'User': log.owner || 'Me',
            'Date': format(log.arrival_timestamp, 'yyyy-MM-dd'),
            'Site': log.siteName || log.siteId || '-',
            'Category': log.category,
            'Subcategory': log.subcategory || '',
            'Start Time': format(log.arrival_timestamp, 'HH:mm:ss'),
            'End Time': log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm:ss') : '--',
            'Halt Duration': log.halt_duration_seconds
                ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
                : 'RUNNING',
            'Status': log.status
        }));

        // Append Grand Total Row?? Excel usually lets users sum. 
        // But we add a summary row for convenience.

        // Effective Grand Total
        const uniqueEventGroups: Record<string, number> = {};
        logs.forEach(log => {
            const key = `${log.siteId || 'legacy'}_${log.arrival_timestamp}`;
            const halt = log.halt_duration_seconds || 0;
            if (!uniqueEventGroups[key] || halt > uniqueEventGroups[key]) uniqueEventGroups[key] = halt;
        });
        const grandTotalSeconds = Object.values(uniqueEventGroups).reduce((sum, val) => sum + val, 0);
        const grandTotalFormatted = new Date(grandTotalSeconds * 1000).toISOString().substr(11, 8);

        data.push({}); // Spacer
        data.push({
            'User': 'GRAND TOTAL (Effective)',
            'Halt Duration': grandTotalFormatted
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Logs");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        if (Capacitor.isNativePlatform()) {
            const savedFile = await Filesystem.writeFile({
                path: `${fileName}.xlsx`,
                data: wbout,
                directory: Directory.Cache,
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
