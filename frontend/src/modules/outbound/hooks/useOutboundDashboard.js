import { useState, useEffect, useCallback, useRef } from 'react';
import { outboundApi } from '../services/outboundApi';

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

export function useOutboundDashboard(propFilters, propUpdateFilter, propResetFilters) {
  const [internalFilters, setInternalFilters] = useState(() => {
    if (propFilters) return propFilters;
    try {
      const params = new URLSearchParams(window.location.search);
      const parseList = (key) => {
        const val = params.get(key);
        if (!val) return [];
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      };
      return {
        year: parseList('year'),
        month: parseList('month'),
        startDate: params.get('startDate') || '',
        endDate: params.get('endDate') || '',
        groupName: parseList('groupName'),
        agent: parseList('agent'),
        disposition: parseList('disposition'),
        subDisposition: parseList('subDisposition'),
        shift: parseList('shift')
      };
    } catch {
      return defaultFilters;
    }
  });
  const filters = propFilters || internalFilters;

  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    groupNames: [],
    dispositions: [],
    subDispositions: [],
    agents: [],
    shifts: []
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRequestId = useRef(0);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const opts = await outboundApi.getFilterOptions();
      if (opts) {
        setFilterOptions(opts);
      }
    } catch (err) {
      console.error('Failed to load Outbound filter options:', err);
      if (err.response?.status === 401) {
        setError('Session expired or unauthorized. Please sign in to view Outbound Call Analytics.');
      }
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    if (propUpdateFilter) {
      propUpdateFilter(key, value);
    } else {
      setInternalFilters((prev) => ({
        ...prev,
        [key]: value
      }));
    }
  }, [propUpdateFilter]);

  const resetFilters = useCallback(() => {
    if (propResetFilters) {
      propResetFilters();
    } else {
      setInternalFilters(defaultFilters);
    }
  }, [propResetFilters]);

  const fetchData = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const result = await outboundApi.getDashboard(filters);
      if (requestId === activeRequestId.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Outbound dashboard API error:', err);
        if (err.response?.status === 401) {
          setError('Session expired or unauthorized. Please sign in to view Outbound Call Analytics.');
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to load Outbound Analytics data.');
        }
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch both filter options and dashboard data when authentication succeeds or new data is uploaded
  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchFilterOptions();
      fetchData();
    };
    window.addEventListener('auth:login', handleRefreshEvent);
    window.addEventListener('outbound:data-uploaded', handleRefreshEvent);
    return () => {
      window.removeEventListener('auth:login', handleRefreshEvent);
      window.removeEventListener('outbound:data-uploaded', handleRefreshEvent);
    };
  }, [fetchFilterOptions, fetchData]);

  const refreshAll = useCallback(() => {
    fetchFilterOptions();
    fetchData();
  }, [fetchFilterOptions, fetchData]);

  return {
    filters,
    filterOptions,
    data,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh: refreshAll
  };
}
