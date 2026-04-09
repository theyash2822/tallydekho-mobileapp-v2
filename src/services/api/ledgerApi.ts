import apiClient from './client';

export const ledgerApi = {
  getLedgers: (companyGuid: string, params?: {
    nature?: string;
    group?: string;
    hideZero?: boolean;
    search?: string;
    sortBy?: 'name' | 'balance';
    sortDir?: 'asc' | 'desc';
  }) => apiClient.get('/ledgers', { params: { companyGuid, ...params } }),

  getLedgerDetail: (ledgerId: string, companyGuid: string, from?: string, to?: string) =>
    apiClient.get(`/ledgers/${ledgerId}`, { params: { companyGuid, from, to } }),

  getLedgerGroups: (companyGuid: string) =>
    apiClient.get('/ledger-groups', { params: { companyGuid } }),

  createLedger: (companyGuid: string, body: {
    name: string;
    nature: string;
    group: string;
    openingBalance?: number;
    openingBalanceType?: 'Dr' | 'Cr';
    narration?: string;
    gstin?: string;
    pan?: string;
    mobile?: string;
    email?: string;
    address?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  }) => apiClient.post('/ledgers', { companyGuid, ...body }),
};
