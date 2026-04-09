import apiClient from './client';

export const salesApi = {
  getSales: (companyGuid: string, params?: {
    from?: string; to?: string;
    status?: string; search?: string;
    page?: number; limit?: number;
  }) => apiClient.get('/sales', { params: { companyGuid, ...params } }),

  getSaleKPIs: (companyGuid: string, fy: string) =>
    apiClient.get('/sales/kpis', { params: { companyGuid, fy } }),

  getTopParties: (companyGuid: string, type: 'customer' | 'vendor', limit?: number) =>
    apiClient.get('/parties/top', { params: { companyGuid, type, limit } }),

  getPurchases: (companyGuid: string, params?: {
    from?: string; to?: string;
    status?: string; search?: string;
    page?: number; limit?: number;
  }) => apiClient.get('/purchases', { params: { companyGuid, ...params } }),

  getVoucherDetail: (voucherId: string, companyGuid: string) =>
    apiClient.get(`/vouchers/${voucherId}`, { params: { companyGuid } }),

  getEWayBills: (companyGuid: string, params?: {
    fy?: string; status?: string; period?: string;
  }) => apiClient.get('/eway-bills', { params: { companyGuid, ...params } }),

  getParties: (companyGuid: string, search?: string) =>
    apiClient.get('/parties', { params: { companyGuid, search } }),
};
