import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFlaggedCalls } from '../services/inboundAuditApi';
import { fetchInboundCallRecordDetail } from '../services/inboundApi';

export function useInboundFlaggedCalls(globalFilters = {}) {
  const [auditRule, setAuditRule] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('call_time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');

  const [data, setData] = useState({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState(null);

  const abortRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const loadFlaggedCalls = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const query = {
        ...globalFilters,
        auditRule,
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: search.trim()
      };

      const result = await fetchFlaggedCalls(query, controller.signal);
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching flagged calls:', err);
        setError(err.message || 'Failed to load flagged records.');
      }
    } finally {
      setLoading(false);
    }
  }, [globalFilters, auditRule, page, pageSize, sortBy, sortOrder, search]);

  useEffect(() => {
    loadFlaggedCalls();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadFlaggedCalls]);

  const handleSearchChange = useCallback((val) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  }, [sortBy]);

  const inspectRecord = useCallback(async (record) => {
    if (!record || !record.id) return;
    setSelectedCallId(record.id);
    setSelectedRecord(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError(null);

    try {
      const fullDetail = await fetchInboundCallRecordDetail(record.id);
      setSelectedRecord(prev => ({ ...prev, ...fullDetail }));
    } catch (err) {
      console.warn('Could not load detailed record, using cached list item:', err);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return {
    auditRule,
    setAuditRule: (rule) => { setAuditRule(rule); setPage(1); },
    page,
    setPage,
    pageSize,
    setPageSize: (size) => { setPageSize(size); setPage(1); },
    sortBy,
    sortOrder,
    handleSort,
    search,
    handleSearchChange,
    data,
    loading,
    error,
    refresh: loadFlaggedCalls,
    // Drawer
    drawerOpen,
    setDrawerOpen,
    selectedRecord,
    drawerLoading,
    drawerError,
    inspectRecord,
    closeDrawer
  };
}
