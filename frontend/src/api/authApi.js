import client from './client';

export const login = async (username, password) => {
  const response = await client.post('/auth/login', { username, password });
  return response.data;
};

export const getUsers = async () => {
  const response = await client.get('/auth/users');
  return response.data;
};
