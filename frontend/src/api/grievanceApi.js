import client from './client';

export const searchGrievances = async (query = {}) => {
  const response = await client.post('/grievances/search', query);
  return response.data;
};

export const getGrievanceById = async (id) => {
  const response = await client.get(`/grievances/${id}`);
  return response.data;
};

export const getGrievanceByCompId = async (compId) => {
  const response = await client.get(`/grievances/by-comp-id/${compId}`);
  return response.data;
};
