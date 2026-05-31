import { Request } from 'express';

export type Role = 'ADMIN' | 'CLIENT';

export interface AuthPayload {
  companyId: string;
  email: string;
  name: string;
  role: Role;
  currency: string;
  emissionFactor: number;
}

export interface AuthRequest extends Request {
  auth: AuthPayload;
}

export interface MachineAnalysis {
  machineId: string;
  machineName: string;
  ratedPowerKw: number;
  dailyHours: number;
  currentBand: string | null;
  currentPricePerKwh: number;
  monthlyKwh: number;
  monthlyCost: number;
  isPeakOperation: boolean;
}

export interface Recommendation {
  machineId: string;
  machineName: string;
  currentBand: string;
  currentPricePerKwh: number;
  suggestedBand: string;
  suggestedPricePerKwh: number;
  monthlyKwhShifted: number;
  monthlySaving: number;
  annualSaving: number;
  co2ReductionKg: number;
  percentageSaving: number;
}

export interface LoadShiftScenario {
  currentTotalCost: number;
  optimizedTotalCost: number;
  totalSaving: number;
  savingPercent: number;
}

export interface AnalysisResult {
  companyId: string;
  computedAt: string;
  currency: string;
  machines: MachineAnalysis[];
  recommendations: Recommendation[];
  totalMonthlyCost: number;
  totalPotentialSaving: number;
  totalPotentialSavingPercent: number;
  totalCo2TonsMonth: number;
  avoidableCo2KgMonth: number;
  peakMachineNames: string[];
  bandDistribution: Record<string, { kwh: number; cost: number }>;
  loadShift: LoadShiftScenario;
}
