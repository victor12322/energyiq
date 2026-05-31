import { PrismaClient } from '@prisma/client';
import { AnalysisResult, MachineAnalysis, Recommendation, LoadShiftScenario } from '../types';

const prisma = new PrismaClient();

export async function runAnalysis(companyId: string): Promise<AnalysisResult> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { tariffBands: true, machines: true },
  });

  const { tariffBands, machines, emissionFactor, currency } = company;

  if (tariffBands.length === 0 || machines.length === 0) {
    return emptyResult(companyId, currency);
  }

  const sortedBands = [...tariffBands].sort((a, b) => a.pricePerKwh - b.pricePerKwh);
  const cheapestBand = sortedBands[0];
  const mostExpensiveBand = sortedBands[sortedBands.length - 1];
  const avgPrice = tariffBands.reduce((s, b) => s + b.pricePerKwh, 0) / tariffBands.length;

  const machineAnalyses: MachineAnalysis[] = [];
  const recommendations: Recommendation[] = [];
  const bandDistribution: Record<string, { kwh: number; cost: number }> = {};

  for (const machine of machines) {
    const currentBand = machine.tariffBandName
      ? (tariffBands.find((b) => b.name === machine.tariffBandName) ?? null)
      : null;

    const currentPrice = currentBand?.pricePerKwh ?? avgPrice;
    const monthlyKwh = machine.ratedPowerKw * machine.dailyHours * 30;
    const monthlyCost = monthlyKwh * currentPrice;
    const isPeakOperation = currentBand?.id === mostExpensiveBand.id;

    machineAnalyses.push({
      machineId: machine.id,
      machineName: machine.name,
      ratedPowerKw: machine.ratedPowerKw,
      dailyHours: machine.dailyHours,
      currentBand: machine.tariffBandName,
      currentPricePerKwh: currentPrice,
      monthlyKwh,
      monthlyCost,
      isPeakOperation,
    });

    const bandKey = machine.tariffBandName ?? 'unassigned';
    if (!bandDistribution[bandKey]) {
      bandDistribution[bandKey] = { kwh: 0, cost: 0 };
    }
    bandDistribution[bandKey].kwh += monthlyKwh;
    bandDistribution[bandKey].cost += monthlyCost;

    // Recommend shifting if not already in cheapest band
    if (currentBand && currentBand.id !== cheapestBand.id) {
      const monthlySaving = monthlyKwh * (currentPrice - cheapestBand.pricePerKwh);
      if (monthlySaving > 0.01) {
        // Approximate avoidable CO₂: treat saving as kWh not consumed at emission factor
        const co2ReductionKg = (monthlySaving / currentPrice) * emissionFactor;
        recommendations.push({
          machineId: machine.id,
          machineName: machine.name,
          currentBand: currentBand.name,
          currentPricePerKwh: currentPrice,
          suggestedBand: cheapestBand.name,
          suggestedPricePerKwh: cheapestBand.pricePerKwh,
          monthlyKwhShifted: monthlyKwh,
          monthlySaving,
          annualSaving: monthlySaving * 12,
          co2ReductionKg,
          percentageSaving: (monthlySaving / monthlyCost) * 100,
        });
      }
    }
  }

  recommendations.sort((a, b) => b.monthlySaving - a.monthlySaving);

  const totalMonthlyCost = machineAnalyses.reduce((s, m) => s + m.monthlyCost, 0);
  const totalPotentialSaving = recommendations.reduce((s, r) => s + r.monthlySaving, 0);
  const totalPotentialSavingPercent =
    totalMonthlyCost > 0 ? (totalPotentialSaving / totalMonthlyCost) * 100 : 0;

  const totalKwhMonth = machineAnalyses.reduce((s, m) => s + m.monthlyKwh, 0);
  const totalCo2TonsMonth = (totalKwhMonth * emissionFactor) / 1000;
  const avoidableCo2KgMonth = recommendations.reduce((s, r) => s + r.co2ReductionKg, 0);

  const peakMachineNames = machineAnalyses
    .filter((m) => m.isPeakOperation)
    .map((m) => m.machineName);

  // Load-shift scenario: what happens if every recommendation is applied
  const optimizedTotalCost = machineAnalyses.reduce((s, m) => {
    const rec = recommendations.find((r) => r.machineId === m.machineId);
    return s + (rec ? m.monthlyKwh * rec.suggestedPricePerKwh : m.monthlyCost);
  }, 0);

  const loadShift: LoadShiftScenario = {
    currentTotalCost: totalMonthlyCost,
    optimizedTotalCost,
    totalSaving: totalMonthlyCost - optimizedTotalCost,
    savingPercent:
      totalMonthlyCost > 0
        ? ((totalMonthlyCost - optimizedTotalCost) / totalMonthlyCost) * 100
        : 0,
  };

  return {
    companyId,
    computedAt: new Date().toISOString(),
    currency,
    machines: machineAnalyses,
    recommendations,
    totalMonthlyCost,
    totalPotentialSaving,
    totalPotentialSavingPercent,
    totalCo2TonsMonth,
    avoidableCo2KgMonth,
    peakMachineNames,
    bandDistribution,
    loadShift,
  };
}

function emptyResult(companyId: string, currency: string): AnalysisResult {
  return {
    companyId,
    computedAt: new Date().toISOString(),
    currency,
    machines: [],
    recommendations: [],
    totalMonthlyCost: 0,
    totalPotentialSaving: 0,
    totalPotentialSavingPercent: 0,
    totalCo2TonsMonth: 0,
    avoidableCo2KgMonth: 0,
    peakMachineNames: [],
    bandDistribution: {},
    loadShift: { currentTotalCost: 0, optimizedTotalCost: 0, totalSaving: 0, savingPercent: 0 },
  };
}
