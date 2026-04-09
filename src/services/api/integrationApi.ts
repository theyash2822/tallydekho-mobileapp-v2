import apiClient from './client';

/**
 * E-Way Bill Integration
 * Portal: https://ewaybillgst.gov.in/apireg/
 * NIC GST E-Way Bill API v1.03
 */
export const ewayBillApi = {
  // Save/update credentials
  // Backend: POST /app/integrations/eway-bill/credentials
  saveCredentials: (body: {
    companyGuid: string;
    gstin: string;
    username: string;
    password: string;
    clientId?: string;
    clientSecret?: string;
  }) => apiClient.post('/integrations/eway-bill/credentials', body),

  // Get connection status
  getStatus: (companyGuid: string) =>
    apiClient.get('/integrations/eway-bill/status', { params: { companyGuid } }),

  // Get list of E-Way Bills
  list: (companyGuid: string, params?: { fy?: string; status?: string }) =>
    apiClient.get('/integrations/eway-bill/list', { params: { companyGuid, ...params } }),

  // Generate E-Way Bill for an invoice
  generate: (body: {
    companyGuid: string;
    voucherId: string;
    transMode: '1' | '2' | '3' | '4'; // Road/Rail/Air/Ship
    transDistance: number;
    transporterName?: string;
    transporterId?: string;
    transDocNo?: string;
    transDocDate?: string;
    vehicleNo?: string;
    vehicleType?: 'R' | 'O'; // Regular/Over-Dimensional
  }) => apiClient.post('/integrations/eway-bill/generate', body),

  // Cancel E-Way Bill
  cancel: (body: {
    companyGuid: string;
    ewbNo: string;
    cancelRsnCode: number; // 1=Duplicate, 2=Order Cancelled, 3=Data Entry Mistake, 4=Others
    cancelRmrk: string;
  }) => apiClient.post('/integrations/eway-bill/cancel', body),

  // Extend validity
  extendValidity: (body: {
    companyGuid: string;
    ewbNo: string;
    vehicleNo: string;
    fromPlace: string;
    fromState: number;
    remainingDistance: number;
    transMode: '1' | '2' | '3' | '4';
    extnRsnCode: number;
    extnRemarks: string;
  }) => apiClient.post('/integrations/eway-bill/extend', body),

  // Get EWB by number
  getByNumber: (companyGuid: string, ewbNo: string) =>
    apiClient.get('/integrations/eway-bill/get', { params: { companyGuid, ewbNo } }),

  // Bulk generate for multiple invoices
  bulkGenerate: (companyGuid: string, voucherIds: string[]) =>
    apiClient.post('/integrations/eway-bill/bulk-generate', { companyGuid, voucherIds }),
};

/**
 * E-Invoicing (IRN) Integration
 * Portal: https://einvoice1.gst.gov.in
 * IRP APIs — Invoice Registration Portal
 * Multiple IRPs: NIC (IRP1), Cygnet (IRP2), Clear (IRP3), EY (IRP4), IRIS (IRP5), Masterindia (IRP6)
 */
export const eInvoiceApi = {
  // Save/update IRP credentials
  saveCredentials: (body: {
    companyGuid: string;
    gstin: string;
    username: string;
    password: string;
    irpProvider: 'NIC' | 'Cygnet' | 'Clear' | 'EY' | 'IRIS' | 'Masterindia';
    clientId?: string;
    clientSecret?: string;
  }) => apiClient.post('/integrations/e-invoice/credentials', body),

  // Get connection status
  getStatus: (companyGuid: string) =>
    apiClient.get('/integrations/e-invoice/status', { params: { companyGuid } }),

  // Generate IRN for an invoice
  generateIRN: (body: {
    companyGuid: string;
    voucherId: string;
  }) => apiClient.post('/integrations/e-invoice/generate-irn', body),

  // Cancel IRN
  cancelIRN: (body: {
    companyGuid: string;
    irn: string;
    cnlRsn: string; // 1=Duplicate, 2=Data Entry Mistake, 3=Order Cancelled, 4=Others
    cnlRem: string;
  }) => apiClient.post('/integrations/e-invoice/cancel-irn', body),

  // Get IRN details
  getIRN: (companyGuid: string, irn: string) =>
    apiClient.get('/integrations/e-invoice/get-irn', { params: { companyGuid, irn } }),

  // Bulk generate IRN for multiple invoices
  bulkGenerateIRN: (companyGuid: string, voucherIds: string[]) =>
    apiClient.post('/integrations/e-invoice/bulk-generate-irn', { companyGuid, voucherIds }),

  // Get pending invoices (no IRN yet)
  getPendingIRN: (companyGuid: string) =>
    apiClient.get('/integrations/e-invoice/pending', { params: { companyGuid } }),
};

// IRP Provider URLs (for display)
export const IRP_PROVIDERS = [
  { id: 'NIC',         name: 'NIC (IRP 1)',        url: 'https://einvoice1.gst.gov.in',   recommended: true },
  { id: 'Cygnet',      name: 'Cygnet (IRP 2)',      url: 'https://einvoice2.gst.gov.in',   recommended: false },
  { id: 'Clear',       name: 'Clear (IRP 3)',       url: 'https://einvoice3.gst.gov.in',   recommended: false },
  { id: 'EY',          name: 'EY (IRP 4)',          url: 'https://einvoice4.gst.gov.in',   recommended: false },
  { id: 'IRIS',        name: 'IRIS (IRP 5)',        url: 'https://einvoice5.gst.gov.in',   recommended: false },
  { id: 'Masterindia', name: 'Masterindia (IRP 6)', url: 'https://einvoice6.gst.gov.in',   recommended: false },
] as const;

export const EWAY_TRANS_MODES = [
  { id: '1', label: 'Road' },
  { id: '2', label: 'Rail' },
  { id: '3', label: 'Air' },
  { id: '4', label: 'Ship' },
] as const;
