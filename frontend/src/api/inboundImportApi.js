import client from './client';

export const previewInboundImportFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/inbound/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const executeInboundImportFile = async (file, username = 'Telephony Administrator') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);
  const response = await client.post('/inbound/import/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getInboundImportHistory = async () => {
  const response = await client.get('/inbound/import/history');
  return response.data;
};

export const getInboundBatchErrors = async (batchId) => {
  const response = await client.get(`/inbound/import/errors/${batchId}`);
  return response.data;
};
