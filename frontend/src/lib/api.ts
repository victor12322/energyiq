import axios from 'axios';
import type {
  TariffBand, Machine, MonthlyBill, MeterReading,
  AnalysisResult, AdminStats, AdminCompany, Company,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error as Error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (d: { name: string; email: string; password: string; currency?: string; emissionFactor?: number }) =>
    api.post<{ token: string; company: Company }>('/auth/register', d),
  login: (d: { email: string; password: string }) =>
    api.post<{ token: string; company: Company }>('/auth/login', d),
  me: () => api.get<Company>('/auth/me'),
  updateMe: (d: Partial<{ name: string; currency: string; emissionFactor: number }>) =>
    api.patch<Company>('/auth/me', d),
};

// ── Tariffs ───────────────────────────────────────────────────────────────────
export const tariffsApi = {
  list: () => api.get<TariffBand[]>('/tariffs'),
  create: (d: Omit<TariffBand, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
    api.post<TariffBand>('/tariffs', d),
  update: (id: string, d: Partial<Omit<TariffBand, 'id' | 'companyId'>>) =>
    api.put<TariffBand>(`/tariffs/${id}`, d),
  delete: (id: string) => api.delete(`/tariffs/${id}`),
};

// ── Machines ──────────────────────────────────────────────────────────────────
export const machinesApi = {
  list: () => api.get<Machine[]>('/machines'),
  create: (d: Omit<Machine, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
    api.post<Machine>('/machines', d),
  update: (id: string, d: Partial<Omit<Machine, 'id' | 'companyId'>>) =>
    api.put<Machine>(`/machines/${id}`, d),
  delete: (id: string) => api.delete(`/machines/${id}`),
};

export type CreateBillPayload = Omit<MonthlyBill, 'id' | 'companyId' | 'createdAt' | 'bandBreakdowns'> & {
  bandBreakdowns?: { bandName: string; kwh: number; cost: number }[];
};

// ── Bills ─────────────────────────────────────────────────────────────────────
export const billsApi = {
  list: () => api.get<MonthlyBill[]>('/bills'),
  create: (d: CreateBillPayload) => api.post<MonthlyBill>('/bills', d),
  update: (id: string, d: Partial<CreateBillPayload>) =>
    api.put<MonthlyBill>(`/bills/${id}`, d),
  delete: (id: string) => api.delete(`/bills/${id}`),
};

// ── Readings ──────────────────────────────────────────────────────────────────
export const readingsApi = {
  list: (params?: { machineId?: string; from?: string; to?: string; limit?: number }) =>
    api.get<MeterReading[]>('/readings', { params }),
  ingest: (d: { machineId?: string; timestamp: string; kwhDelta: number }) =>
    api.post<MeterReading>('/readings', d),
  simulate: (days = 30) => api.post<{ count: number; message: string }>('/readings/simulate', { days }),
};

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analysisApi = {
  run: () => api.get<AnalysisResult>('/analysis'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  downloadPdf: () => api.get('/reports/pdf', { responseType: 'blob' }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  companies: () => api.get<AdminCompany[]>('/admin/companies'),
  stats: () => api.get<AdminStats>('/admin/stats'),
};

// ── Billing ───────────────────────────────────────────────────────────────────
export interface Subscription {
  id?: string;
  companyId?: string;
  plan: string | null;
  status: string;
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
}

export const billingApi = {
  subscription: () => api.get<Subscription>('/billing/subscription'),
  checkout: (plan: string) => api.post<{ url: string }>('/billing/checkout', { plan }),
  portal: () => api.post<{ url: string }>('/billing/portal'),
};

export default api;
