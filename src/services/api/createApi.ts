import apiClient from './client';

export const createApi = {
  // Sales Invoice
  createSalesInvoice: (body: Record<string, any>) =>
    apiClient.post('/tally/sales-invoice', body),

  // Purchase Invoice
  createPurchaseInvoice: (body: Record<string, any>) =>
    apiClient.post('/tally/purchase-invoice', body),

  // Sales Order
  createSalesOrder: (body: Record<string, any>) =>
    apiClient.post('/tally/sales-order', body),

  // Purchase Order
  createPurchaseOrder: (body: Record<string, any>) =>
    apiClient.post('/tally/purchase-order', body),

  // Quotation
  createQuotation: (body: Record<string, any>) =>
    apiClient.post('/tally/quotation', body),

  // Credit Note
  createCreditNote: (body: Record<string, any>) =>
    apiClient.post('/tally/credit-note', body),

  // Debit Note
  createDebitNote: (body: Record<string, any>) =>
    apiClient.post('/tally/debit-note', body),

  // Delivery Note
  createDeliveryNote: (body: Record<string, any>) =>
    apiClient.post('/tally/delivery-note', body),

  // Voucher (Payment/Receipt/Journal/Contra)
  createVoucher: (body: Record<string, any>) =>
    apiClient.post('/tally/voucher', body),

  // Parties
  createParty: (body: Record<string, any>) =>
    apiClient.post('/parties', body),

  // Products/Stock Items
  createProduct: (body: Record<string, any>) =>
    apiClient.post('/stocks/items', body),

  // Get invoice series/number
  getNextVoucherNumber: (companyGuid: string, type: string) =>
    apiClient.get('/voucher-number/next', { params: { companyGuid, type } }),

  // Get HSN codes
  getHSNCodes: (search: string) =>
    apiClient.get('/hsn-codes', { params: { search } }),
};
