import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Typography, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Percent, 
  AlertOctagon,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import FilterBar from '../components/FilterBar';
import GrievanceDetailModal from '../components/GrievanceDetailModal';

// 8 Mandatory Charts
import Chart1BacklogMovement from '../components/charts/Chart1BacklogMovement';
import Chart2AgeingEscalation from '../components/charts/Chart2AgeingEscalation';
import Chart3DistrictPerformance from '../components/charts/Chart3DistrictPerformance';
import Chart4RootCauseGap from '../components/charts/Chart4RootCauseGap';
import Chart5GrievanceHotspots from '../components/charts/Chart5GrievanceHotspots';
import Chart6OfficerWorkload from '../components/charts/Chart6OfficerWorkload';
import Chart7AccessFinancialRisk from '../components/charts/Chart7AccessFinancialRisk';
import Chart8CohortResolution from '../components/charts/Chart8CohortResolution';

import { getDashboardAnalytics, getFilterOptions } from '../api/analyticsApi';

export default function ExecutiveDashboard({ 
  onNavigateToExplorer, 
  onNavigateToInsights,
  onRefresh, 
  isRefreshing,
  targetChart,
  filters: parentFilters,
  onFilterChange: parentFilterChange,
  onResetFilters: parentResetFilters,
  filterOptions: parentFilterOptions
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [localFilterOptions, setLocalFilterOptions] = useState({ districts: [], categories: [], officers: [] });

  const [localFilters, setLocalFilters] = useState({
    district: 'All',
    districts: [],
    category: 'All',
    categories: [],
    status: 'All',
    statuses: [],
    officer: 'All',
    officers: [],
    priority: 'All',
    riskOnly: false,
    startDate: null,
    endDate: null,
  });

  const filters = parentFilters || localFilters;
  const filterOptions = parentFilterOptions || localFilterOptions;

  const [drillDownTarget, setDrillDownTarget] = useState(null);

  // Stale response / race condition protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchDashboard = async (currentFilters) => {
    const currentReqId = ++requestIdRef.current;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardAnalytics(currentFilters, { signal: controller.signal });
      if (currentReqId === requestIdRef.current) {
        setData(res);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return; // Ignore canceled request
      }
      if (currentReqId === requestIdRef.current) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to fetch grievance intelligence data from MSSQL backend.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      if (!parentFilterOptions) {
        try {
          const opts = await getFilterOptions();
          setLocalFilterOptions(opts);
        } catch (e) {
          console.error('Failed to load filter options:', e);
        }
      }
      fetchDashboard(filters);
    };
    loadInitial();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Re-fetch when parent filters change
  useEffect(() => {
    if (parentFilters) {
      fetchDashboard(parentFilters);
    }
  }, [parentFilters]);

  // Handle scroll to chart when targetChart is specified
  useEffect(() => {
    if (targetChart && !loading && data) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`chart-${targetChart.toLowerCase()}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 3px #0284C7, 0 10px 25px -5px rgba(2, 132, 199, 0.25)';
          el.style.borderRadius = '12px';
          el.style.transition = 'all 0.4s ease';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 2500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [targetChart, loading, data]);

  const handleFilterChange = (key, value) => {
    if (parentFilterChange) {
      parentFilterChange(key, value);
    } else {
      const nextFilters = { ...filters, [key]: value };
      if (key === 'districts') {
        nextFilters.district = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'district') {
        if (value === 'All') {
          nextFilters.districts = [];
        } else if (typeof value === 'string') {
          nextFilters.districts = [value];
        }
      } else if (key === 'categories') {
        nextFilters.category = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'category') {
        if (value === 'All') {
          nextFilters.categories = [];
        } else if (typeof value === 'string') {
          nextFilters.categories = [value];
        }
      } else if (key === 'statuses') {
        nextFilters.status = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'status') {
        if (value === 'All') {
          nextFilters.statuses = [];
        } else if (typeof value === 'string') {
          nextFilters.statuses = [value];
        }
      } else if (key === 'officers') {
        nextFilters.officer = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'officer') {
        if (value === 'All') {
          nextFilters.officers = [];
        } else if (typeof value === 'string') {
          nextFilters.officers = [value];
        }
      }
      setLocalFilters(nextFilters);
      fetchDashboard(nextFilters);
    }
  };

  const handleResetFilters = () => {
    if (parentResetFilters) {
      parentResetFilters();
    } else {
      const reset = {
        district: 'All',
        districts: [],
        category: 'All',
        categories: [],
        status: 'All',
        statuses: [],
        officer: 'All',
        officers: [],
        priority: 'All',
        riskOnly: false,
        startDate: null,
        endDate: null,
      };
      setLocalFilters(reset);
      fetchDashboard(reset);
    }
  };

  const handleViewInsight = (chartKey) => {
    if (onNavigateToInsights) {
      onNavigateToInsights(chartKey.toLowerCase());
    }
  };

  const handleDrillDown = (filterOverride) => {
    if (onNavigateToExplorer) {
      const combined = { ...filters, ...filterOverride };
      if (filterOverride?.district && filterOverride.district !== 'All') {
        combined.districts = [filterOverride.district];
      }
      if (filterOverride?.category && filterOverride.category !== 'All') {
        combined.categories = [filterOverride.category];
      }
      if (filterOverride?.status && filterOverride.status !== 'All') {
        combined.statuses = [filterOverride.status];
      }
      if (filterOverride?.officer && filterOverride.officer !== 'All') {
        combined.officers = [filterOverride.officer];
      }
      onNavigateToExplorer(combined);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%', width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Header section */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 800, 
              color: '#0D3B66',
              fontSize: { xs: '18px', sm: '22px', md: '28px', lg: '30px' },
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              minWidth: 0,
              flex: '1 1 auto',
            }}
          >
            Beneficiary Grievance Intelligence Dashboard
          </Typography>
          <Tooltip title="Refresh Dashboard Data" placement="top">
            <IconButton
              onClick={onRefresh || (() => fetchDashboard(filters))}
              disabled={isRefreshing || loading}
              size="small"
              aria-label="Refresh Dashboard Data"
              sx={{
                color: '#0D3B66',
                bgcolor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                p: '6px',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
                '&.Mui-disabled': { color: '#94A3B8', bgcolor: '#F8FAFC' }
              }}
            >
              <RefreshCw size={17} className={isRefreshing || loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748B', fontSize: { xs: '12px', sm: '13px' } }}>
          Executive Redressal Analytics, Ageing Bottlenecks, and Risk Surveillance for Ayushman Bharat (PM-JAY)
        </Typography>
      </Box>

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : data ? (
        <>
          {/* Executive KPI Cards — 6 Cards in ONE Horizontal Row on Desktop */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(6, minmax(0, 1fr))',
              },
              gap: '9px',
              mb: '14px',
            }}
          >
            <KpiCard
              title="Total Grievances"
              value={data.kpis?.totalGrievances || 0}
              subtitle="All logged records"
              icon={Inbox}
              color="#0D3B66"
              bgLight="#E0F2FE"
            />

            <KpiCard
              title="Pending Backlog"
              value={data.kpis?.pendingGrievances || 0}
              subtitle="Open & WIP"
              rate={data.kpis?.pendingRate}
              rateLabel="pend."
              icon={Clock}
              color="#F59E0B"
              bgLight="#FEF3C7"
            />

            <KpiCard
              title="Closed Cases"
              value={data.kpis?.closedGrievances || 0}
              subtitle="Resolved"
              rate={data.kpis?.closureRate}
              rateLabel="closed"
              icon={CheckCircle}
              color="#10B981"
              bgLight="#D1FAE5"
            />

            <KpiCard
              title="Closure Rate"
              value={`${data.kpis?.closureRate || 0}%`}
              subtitle="Closed / Total"
              icon={TrendingUp}
              color="#008080"
              bgLight="#CCFBF1"
            />

            <KpiCard
              title="Pending Rate"
              value={`${data.kpis?.pendingRate || 0}%`}
              subtitle="Pending / Total"
              icon={Percent}
              color="#6366F1"
              bgLight="#EEF2FF"
            />

            <KpiCard
              title="Urgent Attention"
              value={data.kpis?.attentionRequiredCount || 0}
              subtitle="Risk or >30 Days"
              icon={ShieldAlert}
              color="#EF4444"
              bgLight="#FEE2E2"
            />
          </Box>

          {/* 8 Mandatory Analytics Charts Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 1.6, // ~13px gap, matching 12-14px specification
            }}
          >
            {/* Chart 1: Grievance Intake & Unresolved Residue by Registration Month */}
            <Box id="chart-chart1">
              <Chart1BacklogMovement
                data={data.chart1Backlog}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 2: Grievance Ageing & Escalation */}
            <Box id="chart-chart2">
              <Chart2AgeingEscalation
                data={data.chart2Ageing}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 3: District Performance Analysis */}
            <Box id="chart-chart3">
              <Chart3DistrictPerformance
                data={data.chart3DistrictPerformance}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 4: Root Cause & Resolution Gap */}
            <Box id="chart-chart4">
              <Chart4RootCauseGap
                data={data.chart4RootCauseGap}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 5: District-wise Grievance Hotspots */}
            <Box id="chart-chart5">
              <Chart5GrievanceHotspots
                data={data.chart5Hotspots}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 6: Officer Workload Analysis */}
            <Box id="chart-chart6">
              <Chart6OfficerWorkload
                data={data.chart6OfficerWorkload}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 7: Beneficiary Access & Financial Risk */}
            <Box id="chart-chart7">
              <Chart7AccessFinancialRisk
                data={data.chart7RiskAnalysis}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>

            {/* Chart 8: Grievance Cohort Closure Status */}
            <Box id="chart-chart8">
              <Chart8CohortResolution
                data={data.chart8CohortResolution}
                onDrillDown={handleDrillDown}
                onViewInsight={handleViewInsight}
              />
            </Box>
          </Box>
      </>
      ) : null}

      {/* Drill-down Modal */}
      {drillDownTarget && (
        <GrievanceDetailModal
          open={!!drillDownTarget}
          onClose={() => setDrillDownTarget(null)}
          compId={drillDownTarget.compId}
        />
      )}
    </Box>
  );
}
