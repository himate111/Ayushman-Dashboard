import client from '../../../api/client';

function buildQueryString(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.append(key, value.join(','));
      }
    } else {
      params.append(key, String(value).trim());
    }
  });

  const str = params.toString();
  return str ? `?${str}` : '';
}

export async function fetchInboundDashboard(filters = {}, options = {}) {
  const query = buildQueryString(filters);
  const response = await client.get(`/inbound/dashboard${query}`, options);
  return response.data;
}

export async function fetchInboundFilters(options = {}) {
  const response = await client.get('/inbound/filters', options);
  return response.data;
}

export async function fetchInboundKpis(filters = {}, options = {}) {
  const query = buildQueryString(filters);
  const response = await client.get(`/inbound/kpis${query}`, options);
  return response.data;
}

export async function fetchInboundChart(chartName, filters = {}, options = {}) {
  const query = buildQueryString(filters);
  const response = await client.get(`/inbound/charts/${chartName}${query}`, options);
  return response.data;
}

export async function fetchInboundAgents(filters = {}, options = {}) {
  const query = buildQueryString(filters);
  const response = await client.get(`/inbound/agents${query}`, options);
  return response.data;
}

export async function fetchInboundSummary(filters = {}, options = {}) {
  const query = buildQueryString(filters);
  const response = await client.get(`/inbound/summary${query}`, options);
  return response.data;
}

export async function fetchInboundCallRecords(query = {}, options = {}) {
  const qs = buildQueryString(query);
  const response = await client.get(`/inbound/calls${qs}`, options);
  return response.data;
}

export async function fetchInboundCallRecordDetail(id, options = {}) {
  const response = await client.get(`/inbound/calls/${id}`, options);
  return response.data;
}

