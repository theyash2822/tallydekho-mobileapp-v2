/**
 * STATIC DATA — fallback placeholder only
 * All values here are IGNORED once real API responds.
 * Never import this in a screen directly — use via store selectors
 * that automatically prefer real API data.
 */

export const STATIC_DASHBOARD = {
  cashInHand: 0,
  bankBalance: 0,
  receivables: 0,
  payables: 0,
  loansODs: 0,
  payments: 0,
  receipts: 0,
  netCash: 0,
  grossCash: 0,
  netRealisableBalance: 0,
  grossProfit: 0,
  netProfit: 0,
  recentActivity: [],
  trendData: {
    expenses: { value: 0, change: 0 },
    sales:    { value: 0, change: 0 },
    purchases:{ value: 0, change: 0 },
  },
};

export const STATIC_KPI_CHIPS = [
  { id: 'cash',        label: 'Cash In Hand',   value: 0, route: 'CashInHand' },
  { id: 'bank',        label: 'Bank Balance',    value: 0, route: 'BankBalance' },
  { id: 'receivable',  label: 'Receivable',      value: 0, route: 'Receivables' },
  { id: 'payable',     label: 'Payable',         value: 0, route: 'Payables' },
  { id: 'loans',       label: 'Loans & ODs',     value: 0, route: 'LoansODs' },
  { id: 'payments',    label: 'Payments',        value: 0, route: 'Payments' },
  { id: 'receipts',    label: 'Receipts',        value: 0, route: 'Receipts' },
];

export const STATIC_LEDGER_NATURES = ['Asset', 'Liability', 'Income', 'Expense'] as const;

export const STATIC_PAYMENT_TERMS = [
  'Due on Receipt',
  '15 Days',
  '30 Days',
  'Custom',
  'Paid',
] as const;

export const STATIC_VOUCHER_TYPES = [
  'Payment',
  'Receipt',
  'Journal',
  'Contra',
] as const;

export const STATIC_LOGISTICS_TYPES = [
  'Courier',
  'Transport',
  'Freight',
  'Custom',
] as const;

export const STATIC_UNITS = [
  'Pcs', 'Kg', 'Liter', 'Meter', 'Box', 'Dozen', 'Custom',
] as const;

export const STATIC_MODE_OF_PAYMENT = [
  'Cash', 'Bank', 'Cheque', 'NEFT', 'UPI',
] as const;

export const STATIC_FY_OPTIONS = [
  { label: 'FY 2025-26', value: '2025-26' },
  { label: 'FY 2024-25', value: '2024-25' },
  { label: 'FY 2023-24', value: '2023-24' },
] as const;

export const STATIC_DISPATCH_METHODS = [
  'Courier', 'Transport', 'Pickup', 'Hand Delivery',
] as const;

export const STATIC_ADJUSTMENT_TYPES = [
  'Damage', 'Theft', 'Count Correction', 'Other',
] as const;

export const STATIC_GST_RATES = [0, 5, 12, 18, 28] as const;

export const STATIC_TnC_TEMPLATES = [
  'Installation cost will be extra.',
  'Delivery within 7 business days from order confirmation.',
  'Final freight will be confirmed at invoicing.',
  'Loading/Unloading will be taken care by party.',
] as const;
