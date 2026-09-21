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
  // Mirror the dashboard header: INDSIL logo on the left, then the operations
  // label, company name and monitoring description on a clean white surface.
  const height = compact ? 22 : 42;
  const logoX = 14;
  const logoY = compact ? 4 : 7;
  const logoWidth = compact ? 36 : 52;
  const logoHeight = compact ? 13 : 19;
  const textX = logoX + logoWidth + (compact ? 6 : 9);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, height, 'F');
  pdf.setDrawColor(189, 216, 240);
  pdf.setLineWidth(0.45);
  pdf.line(0, height, 210, height);

  if (logoData) pdf.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 87, 168);
  pdf.setFontSize(compact ? 6.5 : 8);
  pdf.text('OPERATIONS  /  DAMPER 01', textX, compact ? 7.5 : 12);

  pdf.setTextColor(0, 63, 125);
  pdf.setFontSize(compact ? 10 : 15);
  pdf.text('INDSIL HYDRO POWER & MANGANESE LTD', textX, compact ? 15 : 22);

  if (!compact) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(104, 120, 113);
    pdf.setFontSize(7.5);
    pdf.text('Online Emergency Stack Monitoring System', textX, 29);
  }

  return height;
}

export async function downloadReport(report) {
  const logoData = await loadLogoData();
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  drawCompanyHeader(pdf, logoData);
  pdf.setTextColor(104, 120, 113); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.text(`Report period: ${formatDate(report.start)} - ${formatDate(report.end)}`, 14, 50);
  pdf.setTextColor(31, 41, 55); pdf.setFontSize(9); pdf.text(`Generated: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date())} IST`, 14, 58);
  pdf.setFillColor(234, 243, 251); pdf.roundedRect(14, 65, 182, 23, 2, 2, 'F');
  pdf.setFontSize(9); pdf.setTextColor(75, 98, 125); pdf.text('TOTAL OPEN TIME', 21, 74); pdf.text('OPEN COUNT', 112, 74);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(0, 63, 125); pdf.text(formatDuration(report.onTime), 21, 84); pdf.text(String(report.openCount), 112, 84);
  autoTable(pdf, { startY: 97, head: [['Date','Time','Status','Duration','Cumulative open time','Open count']], body: report.history.map(x => [x.date, x.time, displayStatus(x.status), x.status === 'ON' ? formatDuration(x.duration) : '—', formatDuration(x.cumulative), x.status === 'ON' ? x.openCount : '—']), styles: { fontSize: 8, cellPadding: 2.5 }, headStyles: { fillColor: [0,63,125] }, alternateRowStyles: { fillColor: [246,248,251] }, margin: { left: 14, right: 14, top: 29 }, didDrawPage: d => { if (d.pageNumber > 1) drawCompanyHeader(pdf, logoData, true); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100); pdf.text(`Page ${d.pageNumber}`, 190, 290, { align: 'right' }); } });
  pdf.save(`damper-report-${formatDate(report.start).replaceAll(' ', '-')}.pdf`);
}
