import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchInboundDashboard, fetchInboundFilters } from '../services/inboundApi';
import { computeInboundInsights } from '../utils/inboundInsightsFormatters';

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

export function useInboundInsights(externalFilters, onExternalFilterChange, onExternalResetFilters) {
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Load filter options on mount
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
        console.warn('Failed to load Inbound filter options:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch consolidated dashboard telemetry
  const fetchTelemetry = useCallback(async (currentFilters) => {
    const currentReqId = ++requestIdRef.current;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchInboundDashboard(currentFilters, { signal: controller.signal });
      if (currentReqId === requestIdRef.current) {
        setData(res);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      if (currentReqId === requestIdRef.current) {
        console.error('Failed to load inbound insights telemetry:', err);
        setError('Failed to fetch inbound call intelligence telemetry from backend.');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTelemetry(filters);
  }, [filters, refreshTrigger, fetchTelemetry]);

  const updateFilter = useCallback((key, value) => {
    if (onExternalFilterChange) {
      onExternalFilterChange(key, value);
    } else {
      setInternalFilters((prev) => ({
        ...prev,
        [key]: value
      }));
    }
  }, [onExternalFilterChange]);

  const resetFilters = useCallback(() => {
    if (onExternalResetFilters) {
      onExternalResetFilters();
    } else {
      setInternalFilters(defaultFilters);
    }
  }, [onExternalResetFilters]);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Dynamic calculation of the 6 analytical entries
  const insights = useMemo(() => {
    return computeInboundInsights(data);
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
    refresh
  };
}
