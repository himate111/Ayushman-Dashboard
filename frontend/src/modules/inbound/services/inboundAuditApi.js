const API_BASE = '/api/inbound/audit';

function buildQueryString(params) {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      if (Array.isArray(value)) {
        if (value.length > 0) searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value);
      }
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAuditOverview(filters = {}, signal) {
  const qs = buildQueryString(filters);
  const response = await fetch(`${API_BASE}/overview${qs}`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch audit overview: ${response.status}`);
  return response.json();
}

export async function fetchFieldCompleteness(filters = {}, signal) {
  const qs = buildQueryString(filters);
  const response = await fetch(`${API_BASE}/field-completeness${qs}`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch field completeness: ${response.status}`);
  return response.json();
}

export async function fetchAuditTrend(filters = {}, signal) {
  const qs = buildQueryString(filters);
  const response = await fetch(`${API_BASE}/trend${qs}`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch audit trend: ${response.status}`);
  return response.json();
}

export async function fetchStatusConsistency(filters = {}, signal) {
  const qs = buildQueryString(filters);
  const response = await fetch(`${API_BASE}/consistency${qs}`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch status consistency: ${response.status}`);
  return response.json();
}

export async function fetchFlaggedCalls(queryParams = {}, signal) {
  const qs = buildQueryString(queryParams);
  const response = await fetch(`${API_BASE}/flagged-calls${qs}`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch flagged calls: ${response.status}`);
  return response.json();
}

export async function fetchAuditRules(signal) {
  const response = await fetch(`${API_BASE}/rules`, { signal });
  if (!response.ok) throw new Error(`Failed to fetch audit rules: ${response.status}`);
  return response.json();
}
