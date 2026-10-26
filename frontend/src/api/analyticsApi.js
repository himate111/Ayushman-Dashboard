import client from './client';

export const getDashboardAnalytics = async (filter = {}, config = {}) => {
  const response = await client.post('/analytics/dashboard', filter, config);
  return response.data;
};

export const getFilterOptions = async () => {
  const response = await client.get('/analytics/filter-options');
  return response.data;
};

export const getDataQuality = async () => {
  const response = await client.get('/analytics/data-quality');
  return response.data;
};
