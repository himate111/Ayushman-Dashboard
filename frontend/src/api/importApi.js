import client from './client';

export const previewImportFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const executeImportFile = async (file, username = 'Executive User') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);
  const response = await client.post('/import/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getImportHistory = async () => {
  const response = await client.get('/import/history');
  return response.data;
};

export const getBatchErrors = async (batchId) => {
  const response = await client.get(`/import/errors/${batchId}`);
  return response.data;
};
