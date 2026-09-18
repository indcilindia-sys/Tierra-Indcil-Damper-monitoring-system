import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDuration } from './dateUtils';
import { displayStatus } from './machineCalculations';

async function loadLogoData() {
  try {
    const response = await fetch('/brand/indsil-logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawCompanyHeader(pdf, logoData, compact = false) {
  const height = compact ? 20 : 37;
  pdf.setFillColor(15, 61, 110);
  pdf.rect(0, 0, 210, height, 'F');

  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(compact ? 10 : 13);
  pdf.text('Indsil India private limited', 14, compact ? 12 : 13);
  pdf.setTextColor(232, 169, 58);
  pdf.setFontSize(compact ? 8 : 16);
  pdf.text('DAMPER MONITORING REPORT', 14, compact ? 17 : 27);

  if (logoData) pdf.addImage(logoData, 'PNG', compact ? 166 : 157, compact ? 4 : 7, compact ? 30 : 38, compact ? 10 : 13);
  return height;
}

export async function downloadReport(report) {
  const logoData = await loadLogoData();
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  drawCompanyHeader(pdf, logoData);
  pdf.setTextColor(224, 237, 250); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.text(`Report period: ${formatDate(report.start)} — ${formatDate(report.end)}`, 14, 33);
  pdf.setTextColor(31, 41, 55); pdf.setFontSize(10); pdf.text(`Generated: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date())} IST`, 14, 46);
  pdf.setFillColor(234, 243, 251); pdf.roundedRect(14, 53, 182, 23, 2, 2, 'F');
  pdf.setFontSize(9); pdf.setTextColor(75, 98, 125); pdf.text('TOTAL OPEN TIME', 21, 62); pdf.text('OPEN COUNT', 112, 62);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(15, 61, 110); pdf.text(formatDuration(report.onTime), 21, 72); pdf.text(String(report.openCount), 112, 72);
  autoTable(pdf, { startY: 85, head: [['Date','Time','Status','Duration','Cumulative open time','Open count']], body: report.history.map(x => [x.date, x.time, displayStatus(x.status), x.status === 'ON' ? formatDuration(x.duration) : '—', formatDuration(x.cumulative), x.status === 'ON' ? x.openCount : '—']), styles: { fontSize: 8, cellPadding: 2.5 }, headStyles: { fillColor: [15,61,110] }, alternateRowStyles: { fillColor: [246,248,251] }, margin: { left: 14, right: 14, top: 27 }, didDrawPage: d => { if (d.pageNumber > 1) drawCompanyHeader(pdf, logoData, true); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100); pdf.text(`Page ${d.pageNumber}`, 190, 290, { align: 'right' }); } });
  pdf.save(`damper-report-${formatDate(report.start).replaceAll(' ', '-')}.pdf`);
}
