import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchInboundCallRecords, fetchInboundCallRecordDetail } from '../services/inboundApi';

const DEFAULT_QUERY = {
  page: 1,
  pageSize: 20,
  sortBy: 'call_time',
  sortOrder: 'desc',
  search: '',
  callEnd: 'All',
  year: '',
  month: '',
  startDate: '',
  endDate: '',
  groupName: '',
  agent: '',
  disposition: '',
  subDisposition: '',
  shift: ''
};

export function useInboundCallRecords(initialFilters = {}) {
  const [query, setQuery] = useState(() => ({
    ...DEFAULT_QUERY,
    ...initialFilters
  }));

  const [data, setData] = useState({
    items: [],
    totalCount: 0,
    totalPages: 1,
    connectedCount: 0,
    abandonedCount: 0,
    avgTalkDurationSeconds: 0,
    avgQueueDurationSeconds: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail inspection drawer state
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Request race condition prevention
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchRecords = useCallback(async (currentQuery) => {
    // Increment request ID to ignore stale responses
    const requestId = ++activeRequestIdRef.current;

    // Abort ongoing in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchInboundCallRecords(currentQuery, {
        signal: abortController.signal
      });

      // Only apply state if this is still the active request
      if (requestId === activeRequestIdRef.current) {
        setData({
          items: response.items || [],
          totalCount: response.totalCount || 0,
          totalPages: response.totalPages || 1,
          connectedCount: response.connectedCount || 0,
          abandonedCount: response.abandonedCount || 0,
          avgTalkDurationSeconds: response.avgTalkDurationSeconds || 0,
          avgQueueDurationSeconds: response.avgQueueDurationSeconds || 0
        });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return; // Normal abort due to newer query
      }
      if (requestId === activeRequestIdRef.current) {
        console.error('Failed to fetch inbound call records:', err);
        setError(err.message || 'Failed to retrieve call records. Please try again.');
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch when query changes
  useEffect(() => {
    fetchRecords(query);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, fetchRecords]);

  // Fetch single call detail
  const inspectCall = useCallback(async (id) => {
    if (!id) {
      setSelectedCallId(null);
      setSelectedCall(null);
      return;
    }

    setSelectedCallId(id);
    setDetailLoading(true);
    setDetailError(null);

    // If already in current page items, use as immediate preview
    const existing = data.items.find((item) => item.id === id);
    if (existing) {
      setSelectedCall(existing);
    }

    try {
      const detail = await fetchInboundCallRecordDetail(id);
      setSelectedCall(detail);
    } catch (err) {
      console.error(`Failed to fetch call detail #${id}:`, err);
      setDetailError(err.message || 'Unable to load call record details.');
    } finally {
      setDetailLoading(false);
    }
  }, [data.items]);

  const closeDetail = useCallback(() => {
    setSelectedCallId(null);
    setSelectedCall(null);
    setDetailError(null);
  }, []);

  const setPage = useCallback((newPage) => {
    setQuery((prev) => ({ ...prev, page: newPage }));
  }, []);

  const setPageSize = useCallback((newPageSize) => {
    setQuery((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  const setSort = useCallback((column) => {
    setQuery((prev) => {
      if (prev.sortBy === column) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
          page: 1
        };
      }
      return {
        ...prev,
        sortBy: column,
        sortOrder: 'desc',
        page: 1
      };
    });
  }, []);

  const setSearch = useCallback((searchTerm) => {
    setQuery((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const setCallEndFilter = useCallback((callEndValue) => {
    setQuery((prev) => ({ ...prev, callEnd: callEndValue, page: 1 }));
  }, []);

  const setGlobalFilters = useCallback((filters) => {
    setQuery((prev) => ({
      ...prev,
      year: filters.year || '',
      month: filters.month || '',
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      groupName: filters.groupName || '',
      agent: filters.agent || '',
      disposition: filters.disposition || '',
      subDisposition: filters.subDisposition || '',
      shift: filters.shift || '',
      page: 1
    }));
  }, []);

  const resetAllFilters = useCallback(() => {
    setQuery({ ...DEFAULT_QUERY });
  }, []);

  return {
    query,
    data,
    loading,
    error,
    selectedCallId,
    selectedCall,
    detailLoading,
    detailError,
    inspectCall,
    closeDetail,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setCallEndFilter,
    setGlobalFilters,
    resetAllFilters,
    refresh: () => fetchRecords(query)
  };
}
