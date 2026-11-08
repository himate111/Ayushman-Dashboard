import client from '../../../api/client';

export const outboundApi = {
  getDashboard: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) params.append(key, val.join(','));
      } else if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await client.get(`/outbound/dashboard?${params.toString()}`);
    return res.data;
  },

  getKpis: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) params.append(key, val.join(','));
      } else if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await client.get(`/outbound/dashboard/kpis?${params.toString()}`);
    return res.data;
  },

  getCharts: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) params.append(key, val.join(','));
      } else if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await client.get(`/outbound/dashboard/charts?${params.toString()}`);
    return res.data;
  },

  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) params.append(key, val.join(','));
      } else if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await client.get(`/outbound/dashboard/summary?${params.toString()}`);
    return res.data;
  },

  getFilterOptions: async () => {
    const res = await client.get('/outbound/dashboard/filter-options');
    return res.data;
  },

  getCallRecords: async (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) params.append(key, val.join(','));
      } else if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await client.get(`/outbound/dashboard/records?${params.toString()}`);
    return res.data;
  },

  getCallRecordById: async (id) => {
    const res = await client.get(`/outbound/dashboard/records/${id}`);
    return res.data;
  },

  previewImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/outbound/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  uploadImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/outbound/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getImportHistory: async (limit = 20) => {
    const res = await client.get(`/outbound/import/history?limit=${limit}`);
    return res.data;
  }
};
