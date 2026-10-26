import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchAuditOverview, 
  fetchFieldCompleteness, 
  fetchAuditTrend, 
  fetchStatusConsistency, 
  fetchAuditRules 
} from '../services/inboundAuditApi';
import { fetchInboundFilters } from '../services/inboundApi';

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

export function useInboundAudit() {
  const [filters, setFilters] = useState(defaultFilters);
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    groups: [],
    agents: [],
    dispositions: [],
    subDispositions: [],
    shifts: []
  });

  const [overview, setOverview] = useState(null);
  const [fieldCompleteness, setFieldCompleteness] = useState([]);
  const [trend, setTrend] = useState([]);
  const [consistency, setConsistency] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Fetch filter options once
  useEffect(() => {
    let mounted = true;
    fetchInboundFilters()
      .then(opts => {
        if (mounted && opts) {
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
      .catch(err => console.error('Failed to load inbound audit filter options:', err));
    return () => { mounted = false; };
  }, []);

  // Fetch audit data whenever filters change
  const loadAuditData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [overviewData, completenessData, trendData, consistencyData, rulesData] = await Promise.all([
        fetchAuditOverview(filters, controller.signal),
        fetchFieldCompleteness(filters, controller.signal),
        fetchAuditTrend(filters, controller.signal),
        fetchStatusConsistency(filters, controller.signal),
        fetchAuditRules(controller.signal)
      ]);

      setOverview(overviewData);
      setFieldCompleteness(completenessData);
      setTrend(trendData);
      setConsistency(consistencyData);
      setRules(rulesData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching inbound audit data:', err);
        setError(err.message || 'Failed to load Inbound audit telemetry.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAuditData();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [loadAuditData]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    filterOptions,
    overview,
    fieldCompleteness,
    trend,
    consistency,
    rules,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh: loadAuditData
  };
}
