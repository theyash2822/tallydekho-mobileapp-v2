import apiClient from './client';

export const dashboardApi = {
  getDashboard: (companyGuid: string, fy: string, period: string) =>
    apiClient.get('/dashboard', { params: { companyGuid, fy, period } }),

  getCashBank: (companyGuid: string) =>
    apiClient.get('/cash-bank', { params: { companyGuid } }),

  getReceivablesPayables: (companyGuid: string) =>
    apiClient.get('/receivables-payables', { params: { companyGuid } }),

  getLoans: (companyGuid: string) =>
    apiClient.get('/loans-ods', { params: { companyGuid } }),

  getRecentActivity: (companyGuid: string) =>
    apiClient.get('/recent-activity', { params: { companyGuid } }),

  // Real-time compliance alerts — IRN pending, EWB pending/expired, GST unmatched
  getAlerts: (companyGuid: string) =>
    apiClient.get('/alerts', { params: { companyGuid } }),
};
