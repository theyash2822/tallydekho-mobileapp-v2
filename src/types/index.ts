// ─── Auth ──────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  mobile: string;
  email?: string;
}

export interface Company {
  guid: string;
  name: string;
  fyStart: string;
  gstin?: string;
}

// ─── Navigation ────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { mobile: string };
  GetStarted: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  SyncTally: undefined;
  PairTally: undefined;
  PairingProgress: undefined;
  MainTabs: undefined;
  // Stack screens accessible from tabs
  CashInHand: undefined;
  BankBalance: undefined;
  BankAccountDetail: { accountId: string };
  Receivables: undefined;
  Payables: undefined;
  LoansODs: undefined;
  Payments: undefined;
  Receipts: undefined;
  Notifications: undefined;
  Settings: undefined;
  SalesRegister: undefined;
  PurchaseRegister: undefined;
  EWayBills: undefined;
  LedgerDetail: { ledgerId: string; ledgerName: string };
  InvoiceDetail: { voucherId: string };
  VoucherDetail: { voucherId: string };
  // Create flows
  CreateSalesInvoice: { prefillData?: Partial<Invoice> };
  CreatePurchaseInvoice: { prefillData?: Partial<Invoice> };
  CreateSalesOrder: undefined;
  CreatePurchaseOrder: undefined;
  CreateQuotation: undefined;
  CreateCreditNote: undefined;
  CreateDebitNote: undefined;
  CreateDeliveryNote: undefined;
  CreateVoucher: { type?: VoucherType };
  CreateParty: { onSave: (party: Party) => void };
  CreateProduct: { onSave: (product: Product) => void };
  // Stock flows
  StockItemDetail: { itemId: string };
  StockTransfer: { itemId?: string };
  StockAdjust: { itemId?: string };
  StockAddItem: undefined;
  StockBulkTransfer: undefined;
  WarehouseDetail: { warehouseId: string };
  // Report flows
  Financial: undefined;
  Compliance: undefined;
  AuditTrail: undefined;
  AIInsights: undefined;
  GSTFiling: undefined;
  UnmatchedList: undefined;
};

export type TabParamList = {
  Home: undefined;
  Ledger: undefined;
  Create: undefined;
  Stocks: undefined;
  Reports: undefined;
};

// ─── Domain Models ────────────────────────────────────────────
export interface Invoice {
  id: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'draft';
  type: 'sales' | 'purchase';
  items: InvoiceItem[];
  logistics?: LogisticsEntry[];
  taxes?: TaxBreakdown;
  irnStatus?: 'generated' | 'pending' | 'failed';
}

export interface InvoiceItem {
  id: string;
  productName: string;
  sku?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountType?: 'percent' | 'flat';
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  warehouseId?: string;
}

export interface LogisticsEntry {
  id: string;
  type: string;
  amount: number;
  trackingNumber?: string;
  remarks?: string;
  taxRate?: number;
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Party {
  id: string;
  name: string;
  contactNumber?: string;
  email?: string;
  billingAddress?: string;
  shippingAddress?: string;
  gstin?: string;
  type: 'customer' | 'vendor' | 'both';
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  hsnCode?: string;
  unit: string;
  defaultPrice: number;
  taxRate: number;
  warehouseId?: string;
  currentStock?: number;
}

export interface Ledger {
  id: string;
  name: string;
  group: string;
  nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
  closingBalance: number;
  closingBalanceType: 'Dr' | 'Cr';
  gstin?: string;
  mobile?: string;
  email?: string;
  address?: string;
  bankDetails?: BankDetails;
}

export interface BankDetails {
  beneficiaryName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch?: string;
  swift?: string;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  amount: number;
  type: 'Dr' | 'Cr';
  balance: number;
  balanceType: 'Dr' | 'Cr';
}

export interface StockItem {
  id: string;
  name: string;
  sku?: string;
  hsnCode?: string;
  unit: string;
  currentStock: number;
  warehouseId: string;
  warehouseName: string;
  unitPrice: number;
  totalValue: number;
  isLowStock?: boolean;
  reorderLevel?: number;
  lastUpdated?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  totalItems: number;
  totalValue: number;
}

export type VoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra';

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  type: VoucherType;
  partyName?: string;
  amount: number;
  modeOfPayment?: string;
  narration?: string;
  status: 'submitted' | 'draft';
}

// ─── API Response wrappers ─────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── UI State ─────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
