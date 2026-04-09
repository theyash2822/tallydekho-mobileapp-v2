import apiClient from './client';

export const stocksApi = {
  getTotalStock: (companyGuid: string, warehouseId?: string, search?: string) =>
    apiClient.get('/stocks', { params: { companyGuid, warehouseId, search } }),

  getStockItem: (itemId: string, companyGuid: string) =>
    apiClient.get(`/stocks/${itemId}`, { params: { companyGuid } }),

  getLowStock: (companyGuid: string) =>
    apiClient.get('/stocks/low-stock', { params: { companyGuid } }),

  getWarehouses: (companyGuid: string) =>
    apiClient.get('/warehouses', { params: { companyGuid } }),

  getWarehouseDetail: (warehouseId: string, companyGuid: string) =>
    apiClient.get(`/warehouses/${warehouseId}`, { params: { companyGuid } }),

  transferStock: (body: {
    companyGuid: string;
    itemId: string;
    fromWarehouse: string;
    toWarehouse: string;
    quantity: number;
    narration?: string;
  }) => apiClient.post('/stocks/transfer', body),

  adjustStock: (body: {
    companyGuid: string;
    itemId: string;
    warehouseId: string;
    adjustmentType: string;
    quantity: number;
    narration?: string;
  }) => apiClient.post('/stocks/adjust', body),

  createItem: (body: {
    companyGuid: string;
    name: string;
    sku?: string;
    hsnCode?: string;
    unit: string;
    defaultPrice: number;
    taxRate: number;
    warehouseId: string;
    initialStock?: number;
  }) => apiClient.post('/stocks/items', body),

  getMovementAnalytics: (companyGuid: string, itemId?: string) =>
    apiClient.get('/stocks/analytics', { params: { companyGuid, itemId } }),
};
