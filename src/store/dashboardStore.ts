import { create } from 'zustand';
import { STATIC_DASHBOARD } from '../constants/staticData';
import type { AsyncState } from '../types';

export type TimePeriod = '7D' | '1M' | '3M' | '6M';

interface DashboardData {
  cashInHand: number;
  bankBalance: number;
  receivables: number;
  payables: number;
  loansODs: number;
  payments: number;
  receipts: number;
  netCash: number;
  grossCash: number;
  netRealisableBalance: number;
  grossProfit: number;
  netProfit: number;
  trendData: {
    expenses: { value: number; change: number };
    sales:    { value: number; change: number };
    purchases:{ value: number; change: number };
  };
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'invoice' | 'voucher' | 'irn' | 'sync';
}

interface DashboardState extends AsyncState<DashboardData> {
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  setData: (data: DashboardData) => void;
  setLoading: () => void;
  setError: (err: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: STATIC_DASHBOARD as DashboardData,
  status: 'idle',
  error: null,
  period: '7D',

  setPeriod: (period) => set({ period }),
  setLoading: () => set({ status: 'loading', error: null }),
  setData: (data) => set({ data, status: 'success', error: null }),
  setError: (error) => set({ error, status: 'error' }),
}));
