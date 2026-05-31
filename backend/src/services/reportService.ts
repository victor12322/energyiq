import PDFDocument from 'pdfkit';
import { Company } from '@prisma/client';
import { AnalysisResult } from '../types';

const BRAND_BLUE = '#2563EB';
const BRAND_DARK = '#1E293B';
const GRAY = '#64748B';
const LIGHT_GRAY = '#F1F5F9';

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export async function generatePdfReport(
  company: Company,
  analysis: AnalysisResult
): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const { width } = doc.page;
  const contentWidth = width - 100;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.rect(0, 0, width, 80).fill(BRAND_BLUE);
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('EnergyIQ', 50, 22);
  doc.fontSize(10).font('Helvetica').text('Energy Efficiency Analysis Report', 50, 48);
  doc.fillColor('white').fontSize(10).text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    0,
    48,
    { align: 'right' }
  );

  doc.moveDown(4);

  // ── Company Info ─────────────────────────────────────────────────────────────
  doc.fillColor(BRAND_DARK).fontSize(16).font('Helvetica-Bold').text(company.name);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(company.email);
  doc.fillColor(GRAY).text(
    `Currency: ${company.currency}  |  Emission factor: ${company.emissionFactor} kg CO₂/kWh`
  );

  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(width - 50, doc.y).strokeColor('#E2E8F0').stroke();
  doc.moveDown(1);

  // ── Executive Summary ────────────────────────────────────────────────────────
  doc.fillColor(BRAND_DARK).fontSize(13).font('Helvetica-Bold').text('Executive Summary');
  doc.moveDown(0.6);

  const summaryItems = [
    ['Monthly Energy Cost', `${analysis.currency} ${fmt(analysis.totalMonthlyCost)}`],
    ['Potential Monthly Saving', `${analysis.currency} ${fmt(analysis.totalPotentialSaving)} (${fmt(analysis.totalPotentialSavingPercent, 1)}%)`],
    ['Annual Saving Opportunity', `${analysis.currency} ${fmt(analysis.totalPotentialSaving * 12)}`],
    ['CO₂ Footprint', `${fmt(analysis.totalCo2TonsMonth, 3)} t CO₂/month`],
    ['Avoidable CO₂', `${fmt(analysis.avoidableCo2KgMonth, 1)} kg CO₂/month`],
    ['Machines Analysed', String(analysis.machines.length)],
    ['Recommendations', String(analysis.recommendations.length)],
  ];

  summaryItems.forEach(([label, value], i) => {
    const y = doc.y;
    const bg = i % 2 === 0 ? LIGHT_GRAY : 'white';
    doc.rect(50, y, contentWidth, 22).fill(bg);
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(label, 58, y + 6);
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').text(value, 58, y + 6, { align: 'right', width: contentWidth - 16 });
    doc.moveDown(0.85);
  });

  doc.moveDown(1);

  // ── Recommendations ───────────────────────────────────────────────────────────
  if (analysis.recommendations.length > 0) {
    doc.addPage();
    doc.fillColor(BRAND_DARK).fontSize(13).font('Helvetica-Bold').text('Recommendations (ranked by impact)');
    doc.moveDown(0.8);

    const colWidths = [130, 75, 75, 80, 85];
    const headers = ['Machine', 'From Band', 'To Band', `Save/month`, 'CO₂ Saved/mo'];

    // Table header
    let x = 50;
    doc.rect(50, doc.y, contentWidth, 22).fill(BRAND_BLUE);
    headers.forEach((h, idx) => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(h, x + 4, doc.y - 18, {
        width: colWidths[idx] - 6,
      });
      x += colWidths[idx];
    });
    doc.moveDown(0.2);

    analysis.recommendations.forEach((r, i) => {
      const y = doc.y;
      const bg = i % 2 === 0 ? LIGHT_GRAY : 'white';
      doc.rect(50, y, contentWidth, 22).fill(bg);

      const cells = [
        r.machineName,
        r.currentBand,
        r.suggestedBand,
        `${analysis.currency} ${fmt(r.monthlySaving)}`,
        `${fmt(r.co2ReductionKg, 1)} kg`,
      ];

      x = 50;
      cells.forEach((cell, idx) => {
        doc.fillColor(BRAND_DARK).fontSize(9).font('Helvetica').text(cell, x + 4, y + 6, {
          width: colWidths[idx] - 6,
        });
        x += colWidths[idx];
      });
      doc.moveDown(0.85);

      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }
    });

    doc.moveDown(1);
  }

  // ── Machine Breakdown ────────────────────────────────────────────────────────
  if (analysis.machines.length > 0) {
    if (doc.y > doc.page.height - 200) doc.addPage();

    doc.fillColor(BRAND_DARK).fontSize(13).font('Helvetica-Bold').text('Machine Energy Breakdown');
    doc.moveDown(0.8);

    const colWidths2 = [120, 60, 60, 80, 80, 45];
    const headers2 = ['Machine', 'kW rated', 'h/day', 'kWh/month', `Cost/month`, 'Band'];

    let x2 = 50;
    doc.rect(50, doc.y, contentWidth, 22).fill(BRAND_BLUE);
    headers2.forEach((h, idx) => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(h, x2 + 4, doc.y - 18, {
        width: colWidths2[idx] - 6,
      });
      x2 += colWidths2[idx];
    });
    doc.moveDown(0.2);

    analysis.machines.forEach((m, i) => {
      const y = doc.y;
      const bg = i % 2 === 0 ? LIGHT_GRAY : 'white';
      doc.rect(50, y, contentWidth, 22).fill(bg);

      const cells2 = [
        m.machineName,
        fmt(m.ratedPowerKw, 1),
        fmt(m.dailyHours, 1),
        fmt(m.monthlyKwh, 0),
        `${analysis.currency} ${fmt(m.monthlyCost)}`,
        m.currentBand ?? '—',
      ];

      x2 = 50;
      cells2.forEach((cell, idx) => {
        doc.fillColor(BRAND_DARK).fontSize(9).font('Helvetica').text(cell, x2 + 4, y + 6, {
          width: colWidths2[idx] - 6,
        });
        x2 += colWidths2[idx];
      });
      doc.moveDown(0.85);

      if (doc.y > doc.page.height - 120) doc.addPage();
    });
  }

  // ── Footer (iterate over buffered pages) ─────────────────────────────────────
  const range = doc.bufferedPageRange();
  const pageCount = range.count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(range.start + i);
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `EnergyIQ · Confidential · Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 40,
        { align: 'center', width: contentWidth }
      );
  }

  doc.flushPages();
  return doc;
}
