import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { outboundApi } from '../services/outboundApi';
import { computeOutboundInsights } from '../utils/outboundInsightsFormatters';

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

export function useOutboundInsights(propFilters, propUpdateFilter, propResetFilters) {
  const [internalFilters, setInternalFilters] = useState(defaultFilters);
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
      console.warn('Failed to load Outbound filter options in insights:', err);
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
        console.error('Outbound insights API error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load Outbound Analytics insights.');
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

  const insights = useMemo(() => {
    return computeOutboundInsights(data);
  }, [data]);

  return {
    filters,
    filterOptions,
    data,
    insights,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh: refreshAll
  };
}
