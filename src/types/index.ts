export type Role = 'ADMIN' | 'CLIENT';

export interface Company {
  id: string;
  name: string;
  email: string;
  role: Role;
  currency: string;
  emissionFactor: number;
  createdAt: string;
}

export interface TariffBand {
  id: string;
  companyId: string;
  name: string;
  pricePerKwh: number;
  startHour: number;
  endHour: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  id: string;
  companyId: string;
  name: string;
  ratedPowerKw: number;
  dailyHours: number;
  tariffBandName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillBandBreakdown {
  id: string;
  billId: string;
  bandName: string;
  kwh: number;
  cost: number;
}

export interface MonthlyBill {
  id: string;
  companyId: string;
  month: number;
  year: number;
  totalCost: number;
  totalKwh: number;
  currency: string;
  notes: string | null;
  bandBreakdowns: BillBandBreakdown[];
  createdAt: string;
}

export interface MeterReading {
  id: string;
  companyId: string;
  machineId: string | null;
  machine: { name: string } | null;
  timestamp: string;
  kwhDelta: number;
  createdAt: string;
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

export interface AuthUser {
  companyId: string;
  email: string;
  name: string;
  role: Role;
  currency: string;
  emissionFactor: number;
}

export interface AdminStats {
  totalCompanies: number;
  totalMachines: number;
  totalBillCost: number;
  totalBillKwh: number;
  estimatedMrr: number;
}

export interface AdminCompany extends Company {
  _count: { machines: number; monthlyBills: number; meterReadings: number };
}
