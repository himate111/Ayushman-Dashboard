import { useState, useEffect, useCallback } from 'react';
import { fetchInboundDashboard, fetchInboundFilters } from '../services/inboundApi';

const defaultFilters = {
  year: [],
  month: [],
  startDate: '',
  endDate: '',
  groupName: [],
  agent: [],
  disposition: [],
  subDisposition: [],
  shift: []
};

const emptyDashboard = {
  kpis: {
    totalCalls: 0,
    connectedCalls: 0,
    notConnectedCalls: 0,
    connectionRate: 0,
    notConnectedPercentage: 0,
    avgCallDurationSeconds: 0,
    avgAgentDurationSeconds: 0,
    avgQueueDurationSeconds: 0,
    avgCallDuration: '0s',
    avgAgentDuration: '0s',
    avgQueueDuration: '0s'
  },
  charts: {
    callEnd: [],
    dispositions: [],
    groups: [],
    shifts: [],
    connectedByShift: [],
    notConnectedByShift: [],
    topSubDispositions: [],
    topAgents: [],
    bottomAgents: [],
    hourly: [],
    callsByYear: [],
    callsByMonth: []
  },
  agentAnalytics: {
    topAgents: [],
    bottomAgents: []
  },
  summary: {
    executive: [],
    issues: [],
    dataQuality: [],
    recommendations: []
  }
};

export function useInboundDashboard(externalFilters, onExternalFilterChange, onExternalResetFilters) {
  const [internalFilters, setInternalFilters] = useState(defaultFilters);
  const filters = externalFilters !== undefined ? externalFilters : internalFilters;
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    groups: [],
    agents: [],
    dispositions: [],
    subDispositions: [],
    shifts: []
  });
  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load filter options once on mount
  useEffect(() => {
    let active = true;
    fetchInboundFilters()
      .then((opts) => {
        if (active && opts) {
          setFilterOptions({
            years: opts.years || [],
            months: opts.months || [],
            groups: opts.groups || [],
            agents: opts.agents || [],
            dispositions: opts.dispositions || [],
            subDispositions: opts.subDispositions || [],
            shifts: opts.shifts || []
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch Inbound filter options:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch dashboard data whenever filters or refresh trigger changes
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    fetchInboundDashboard(filters, { signal: controller.signal })
      .then((res) => {
        if (!ignore) {
          setData(res || emptyDashboard);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return;
        }
        if (!ignore) {
          console.error('Failed to load Inbound dashboard:', err);
          setError('Failed to fetch Inbound call analytics from ASP.NET Core backend.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [filters, refreshTrigger]);

  const updateFilter = useCallback((key, value) => {
    setLoading(true);
    if (onExternalFilterChange) {
      onExternalFilterChange(key, value);
    } else {
      setInternalFilters((prev) => ({ ...prev, [key]: value }));
    }
  }, [onExternalFilterChange]);

  const resetFilters = useCallback(() => {
    setLoading(true);
    if (onExternalResetFilters) {
      onExternalResetFilters();
    } else {
      setInternalFilters(defaultFilters);
    }
  }, [onExternalResetFilters]);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    filters,
    filterOptions,
    data,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh
  };
}
