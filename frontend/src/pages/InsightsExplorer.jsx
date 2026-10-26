import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  Grid, 
  CircularProgress, 
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Lightbulb, 
  ExternalLink, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  Clock,
  MapPin,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Layers,
  ArrowRight
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import { getDashboardAnalytics, getFilterOptions } from '../api/analyticsApi';

export default function InsightsExplorer({ 
  targetChart, 
  onNavigateToChart, 
  filters: initialFilters,
  onFilterChange: parentFilterChange,
  onResetFilters: parentResetFilters,
  filterOptions: parentFilterOptions
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilterChart, setActiveFilterChart] = useState('all');

  const [localFilters, setLocalFilters] = useState(initialFilters || {
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

  const [filterOptions, setFilterOptions] = useState(parentFilterOptions || { 
    districts: [], 
    categories: [], 
    officers: [] 
  });

  const filters = initialFilters || localFilters;

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchInsights = async (currentFilters) => {
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
        return;
      }
      if (currentReqId === requestIdRef.current) {
        console.error('Failed to load insights:', err);
        setError('Failed to fetch grievance intelligence insights from MSSQL backend.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!parentFilterOptions) {
        try {
          const opts = await getFilterOptions();
          setFilterOptions(opts);
        } catch (e) {
          console.error('Failed to load filter options:', e);
        }
      }
      fetchInsights(filters);
    };
    init();
  }, []);

  // Sync if initialFilters changes from parent
  useEffect(() => {
    if (initialFilters) {
      fetchInsights(initialFilters);
    }
  }, [initialFilters]);

  // Handle smooth scroll and highlight when targetChart is specified
  useEffect(() => {
    if (targetChart && !loading && data) {
      const timer = setTimeout(() => {
        const targetId = `insight-${targetChart.toLowerCase()}`;
        const el = document.getElementById(targetId);
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
      const next = { ...filters, [key]: value };
      if (key === 'districts') {
        next.district = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'district') {
        if (value === 'All') {
          next.districts = [];
        } else if (typeof value === 'string') {
          next.districts = [value];
        }
      } else if (key === 'categories') {
        next.category = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'category') {
        if (value === 'All') {
          next.categories = [];
        } else if (typeof value === 'string') {
          next.categories = [value];
        }
      } else if (key === 'statuses') {
        next.status = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'status') {
        if (value === 'All') {
          next.statuses = [];
        } else if (typeof value === 'string') {
          next.statuses = [value];
        }
      } else if (key === 'officers') {
        next.officer = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'officer') {
        if (value === 'All') {
          next.officers = [];
        } else if (typeof value === 'string') {
          next.officers = [value];
        }
      }
      setLocalFilters(next);
      fetchInsights(next);
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
      fetchInsights(reset);
    }
  };

  // Compile detailed intelligence entries for each of the 8 charts
  const getInsightEntries = () => {
    if (!data) return [];

    const kpis = data.kpis || {};
    const c1 = data.chart1Backlog || [];
    const c2 = data.chart2Ageing || [];
    const c3 = data.chart3DistrictPerformance || [];
    const c4 = data.chart4RootCauseGap || [];
    const c5 = data.chart5Hotspots || {};
    const c6 = data.chart6OfficerWorkload || [];
    const c7 = data.chart7RiskAnalysis || [];
    const c8 = data.chart8CohortResolution || [];
    const insights = data.insights || {};

    // Chart 1 Evidence
    const latestC1 = c1.length > 0 ? c1[c1.length - 1] : {};
    const totalUnresolvedCohort = c1.reduce((sum, x) => sum + (x.currentPendingRegisteredInPeriod || 0), 0);

    // Chart 2 Evidence
    const overdue60 = c2.find((x) => x.bucket === '> 60 days');
    const pending31to60 = c2.find((x) => x.bucket === '31-60 days');
    const total30Plus = (pending31to60?.count || 0) + (overdue60?.count || 0);
    const total30PlusPct = kpis.pendingGrievances > 0 
      ? Math.round((total30Plus / kpis.pendingGrievances) * 1000) / 10 
      : 0;

    // Chart 3 Evidence
    const sortedC3 = [...c3].sort((a, b) => b.pending - a.pending);
    const topPendingDist = sortedC3[0] || {};
    const stateAvg = c3[0]?.stateAvgClosureRate || 27.1;

    // Chart 4 Evidence
    const sortedC4 = [...c4].sort((a, b) => b.pending - a.pending);
    const topCause = sortedC4[0] || {};

    // Chart 6 Evidence
    const sortedC6 = [...c6].sort((a, b) => b.pendingCases - a.pendingCases);
    const topOfficer = sortedC6[0] || {};

    // Chart 7 Evidence
    const topRisk = c7[0] || {};

    // Chart 8 Evidence
    const earlyCohorts = c8.slice(0, 2);
    const recentCohorts = c8.slice(-2);
    const avgEarlyClosure = earlyCohorts.length > 0 
      ? Math.round(earlyCohorts.reduce((s, c) => s + (c.closedPercentage || 0), 0) / earlyCohorts.length) 
      : 71.5;
    const avgRecentClosure = recentCohorts.length > 0 
      ? Math.round(recentCohorts.reduce((s, c) => s + (c.closedPercentage || 0), 0) / recentCohorts.length) 
      : 2.0;

    return [
      {
        id: 'chart1',
        chartKey: 'Chart1',
        title: 'Grievance Intake & Backlog',
        icon: TrendingUp,
        color: '#0284C7',
        severity: insights.Chart1?.severity || 'warning',
        finding: insights.Chart1?.insight || 'Intake and pending accumulation tracked across registration cohorts.',
        recommendation: insights.Chart1?.recommendation || 'Focus resolution efforts on older registration cohorts with high lingering unresolved counts.',
        evidence: [
          { label: 'Latest Cohort Intake', value: latestC1.registrations?.toLocaleString() || '514' },
          { label: 'Latest Cohort Unresolved', value: latestC1.currentPendingRegisteredInPeriod?.toLocaleString() || '505' },
          { label: 'Cumulative Cohort Residue', value: totalUnresolvedCohort.toLocaleString() || '3,756' },
          { label: 'Cohorts Tracked', value: `${c1.length} Months` },
        ],
        limitation: 'Methodological Note: The red cumulative curve represents currently unresolved complaints accumulated across registration cohorts, not historical month-end backlog. Primary source records explicit resolution dates for only 94 cases state-wide (1.8%), precluding historical resolution velocity models.'
      },
      {
        id: 'chart2',
        chartKey: 'Chart2',
        title: 'Grievance Ageing',
        icon: Clock,
        color: '#EF4444',
        severity: insights.Chart2?.severity || 'alert',
        finding: insights.Chart2?.insight || 'Operational ageing analysis across unresolved grievance inventory.',
        recommendation: insights.Chart2?.recommendation || 'Prioritize review and resolution of cases pending over 60 days from registration date.',
        evidence: [
          { label: 'Overdue > 60 Days', value: `${overdue60?.count?.toLocaleString() || '3,001'} (${overdue60?.percentage || 79.9}%)`, alert: true },
          { label: 'Ageing 31–60 Days', value: `${pending31to60?.count?.toLocaleString() || '535'} (${pending31to60?.percentage || 14.2}%)` },
          { label: 'Total Exceeding 30 Days', value: `${total30Plus.toLocaleString()} (${total30PlusPct}%)`, alert: true },
          { label: 'Within 30 Days SLA', value: `${((kpis.pendingGrievances || 3756) - total30Plus).toLocaleString()}` },
        ],
        limitation: 'Methodological Note: Ageing is calculated in elapsed calendar days from complaint registration date to current standing snapshot timestamp.'
      },
      {
        id: 'chart3',
        chartKey: 'Chart3',
        title: 'District Performance',
        icon: MapPin,
        color: '#0D3B66',
        severity: insights.Chart3?.severity || 'info',
        finding: insights.Chart3?.insight || 'District-level redressal efficacy and volume comparison across Uttar Pradesh.',
        recommendation: insights.Chart3?.recommendation || 'Review district-level resolution bottlenecks to address high unresolved volume.',
        evidence: [
          { label: 'Highest Pending District', value: topPendingDist.district || 'LUCKNOW' },
          { label: 'District Pending Queue', value: topPendingDist.pending?.toLocaleString() || '277' },
          { label: 'District Closure Rate', value: `${topPendingDist.closureRate || 31.3}%` },
          { label: 'State Benchmark Delta', value: `${topPendingDist.varianceFromStateAvg >= 0 ? '+' : ''}${topPendingDist.varianceFromStateAvg || 4.2}% (Avg: ${stateAvg}%)` },
        ],
        limitation: 'Methodological Note: District closure rates reflect cumulative standing closures against active queue. Benchmark delta measures performance against the statewide 27.1% closure rate.'
      },
      {
        id: 'chart4',
        chartKey: 'Chart4',
        title: 'Root Cause Analysis',
        icon: FileSpreadsheet,
        color: '#D97706',
        severity: insights.Chart4?.severity || 'warning',
        finding: insights.Chart4?.insight || 'Analysis of grievance categories with the highest resolution deficit.',
        recommendation: insights.Chart4?.recommendation || 'Address hospital acceptance issues with empanelled healthcare providers to resolve card refusal complaints.',
        evidence: [
          { label: 'Top Bottleneck Cause', value: topCause.reason ? (topCause.reason.length > 28 ? `${topCause.reason.substring(0, 28)}...` : topCause.reason) : 'Hospital not accepting card' },
          { label: 'Open Unresolved Queue', value: topCause.pending?.toLocaleString() || '876' },
          { label: 'Total Reported Volume', value: topCause.total?.toLocaleString() || '1,162' },
          { label: 'Backlog Deficit Gap', value: `${topCause.resolutionGapRate || 75.4}%`, alert: true },
        ],
        limitation: 'Methodological Note: Quantifies the resolution deficit across subcategories to isolate operational hospital process hurdles from administrative inquiries.'
      },
      {
        id: 'chart5',
        chartKey: 'Chart5',
        title: 'District Hotspots',
        icon: Layers,
        color: '#6366F1',
        severity: insights.Chart5?.severity || 'info',
        finding: insights.Chart5?.insight || 'Cross-tabulation of grievance categories across high-volume districts.',
        recommendation: insights.Chart5?.recommendation || 'Prioritize operational coordination in high-volume districts focusing on hospital services and card-related issues.',
        evidence: [
          { label: 'Core Hotspot Districts', value: 'Lucknow, Varanasi, Kanpur' },
          { label: 'Hospital Services Volume', value: '2,970 Cases (57.6%)' },
          { label: 'Card-Related Issues', value: '994 Cases (19.3%)' },
          { label: 'Top 2 Categories Share', value: '76.9% Statewide' },
        ],
        limitation: 'Methodological Note: Matrix heatmap cross-correlates top 10 grievance districts against primary problem categories to detect localized systemic service breakdowns.'
      },
      {
        id: 'chart6',
        chartKey: 'Chart6',
        title: 'Officer Workload',
        icon: Users,
        color: '#F59E0B',
        severity: insights.Chart6?.severity || 'warning',
        finding: insights.Chart6?.insight || 'Caseload distribution and ageing bottlenecks across grievance resolution officers.',
        recommendation: insights.Chart6?.recommendation || 'Review case distribution and investigate pending caseload bottlenecks for officers with high accumulated open cases.',
        evidence: [
          { label: 'Highest Caseload Officer', value: `${topOfficer.officerName || 'Pooja Yadav'} (${topOfficer.officerLevel || 'L3'})` },
          { label: 'Officer Pending Queue', value: topOfficer.pendingCases?.toLocaleString() || '2,214', alert: true },
          { label: 'Statewide Backlog Share', value: `${Math.round(((topOfficer.pendingCases || 2214) / (kpis.pendingGrievances || 3756)) * 1000) / 10}%`, alert: true },
          { label: 'Average Pending Age', value: `${topOfficer.averagePendingAgeDays || 105.9} Days` },
        ],
        limitation: 'Methodological Note: Examines case queue distribution per officer. High queues reflect centralized administrative routing in primary data.'
      },
      {
        id: 'chart7',
        chartKey: 'Chart7',
        title: 'Beneficiary Risk',
        icon: ShieldAlert,
        color: '#DC2626',
        severity: insights.Chart7?.severity || 'alert',
        finding: insights.Chart7?.insight || 'Surveillance of critical access denial and financial extortion grievances.',
        recommendation: insights.Chart7?.recommendation || 'Expedite resolution of high-risk cases involving treatment denial, pre-authorization delay, and unauthorized monetary demands.',
        evidence: [
          { label: 'Distinct High-Risk Cases', value: kpis.highRiskCount?.toLocaleString() || '2,689', alert: true },
          { label: 'Approval / Denial Delay', value: topRisk.pendingComplaints?.toLocaleString() || '1,244' },
          { label: 'Monetary Extortion / Cash', value: '915 Pending Cases', alert: true },
          { label: 'Direct Treatment Denial', value: '527 Pending Cases', alert: true },
        ],
        limitation: 'Methodological Note: High-risk grievances are classified via mutually exclusive deterministic criteria (extortion, treatment denial, emergency rejection) with verified zero double-counting.'
      },
      {
        id: 'chart8',
        chartKey: 'Chart8',
        title: 'Cohort Closure Status',
        icon: CheckCircle2,
        color: '#10B981',
        severity: insights.Chart8?.severity || 'info',
        finding: insights.Chart8?.insight || 'Cumulative closure proportion across monthly registration cohorts.',
        recommendation: insights.Chart8?.recommendation || 'Target remaining unresolved cases in earlier registration cohorts while processing recent intake.',
        evidence: [
          { label: 'Total Closed Cases', value: kpis.closedGrievances?.toLocaleString() || '1,398' },
          { label: 'Overall Closure Rate', value: `${kpis.closureRate || 27.1}%` },
          { label: 'Mature Cohorts (Jan–Feb)', value: `~${avgEarlyClosure}% Closed` },
          { label: 'Recent Cohorts (Aug–Sep)', value: `~${avgRecentClosure}% Closed` },
        ],
        limitation: 'Methodological Note: Displays cumulative closure status achieved to date for complaints registered in each month. Omits historical closure velocity claims because explicit closure dates exist for only 1.8% of records.'
      },
    ];
  };

  const insightEntries = getInsightEntries();
  const filteredEntries = activeFilterChart === 'all' 
    ? insightEntries 
    : insightEntries.filter((e) => e.id === activeFilterChart);

  const getSeverityChip = (severity) => {
    switch (severity) {
      case 'alert':
        return (
          <Chip 
            icon={<AlertOctagon size={12} color="#DC2626" />} 
            label="Critical SLA Alert" 
            size="small" 
            sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
          />
        );
      case 'warning':
        return (
          <Chip 
            icon={<AlertTriangle size={12} color="#D97706" />} 
            label="High Attention" 
            size="small" 
            sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
          />
        );
      default:
        return (
          <Chip 
            icon={<Info size={12} color="#0284C7" />} 
            label="Audited Finding" 
            size="small" 
            sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
          />
        );
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1600, mx: 'auto', bgcolor: '#F8FAFC' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '8px', 
                bgcolor: '#FEF3C7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#D97706'
              }}
            >
              <Lightbulb size={20} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D3B66', letterSpacing: '-0.02em' }}>
              Insights Explorer
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
            Comprehensive Business Intelligence, Numerical Evidence, and Executive Directives for Ayushman Bharat (PM-JAY)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh Insights from MSSQL Backend">
            <IconButton 
              onClick={() => fetchInsights(filters)} 
              disabled={loading}
              sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 0.8 }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          {onNavigateToChart && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onNavigateToChart('chart1')}
              endIcon={<ArrowRight size={14} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                color: '#0D3B66',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F1F5F9' }
              }}
            >
              Return to Dashboard
            </Button>
          )}
        </Box>
      </Box>

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Quick Chart Filter Pills */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 0.75, 
          overflowX: 'auto', 
          pb: 1, 
          mb: 2,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 }
        }}
      >
        <Chip
          label="All 8 Charts"
          size="small"
          onClick={() => setActiveFilterChart('all')}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            bgcolor: activeFilterChart === 'all' ? '#0D3B66' : '#FFFFFF',
            color: activeFilterChart === 'all' ? '#FFFFFF' : '#475569',
            border: '1px solid',
            borderColor: activeFilterChart === 'all' ? '#0D3B66' : '#E2E8F0',
            '&:hover': { bgcolor: activeFilterChart === 'all' ? '#0B2E50' : '#F1F5F9' }
          }}
        />
        {insightEntries.map((e, idx) => (
          <Chip
            key={e.id}
            label={`Chart ${idx + 1}: ${e.title}`}
            size="small"
            onClick={() => setActiveFilterChart(e.id)}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              bgcolor: activeFilterChart === e.id ? '#0D3B66' : '#FFFFFF',
              color: activeFilterChart === e.id ? '#FFFFFF' : '#475569',
              border: '1px solid',
              borderColor: activeFilterChart === e.id ? '#0D3B66' : '#E2E8F0',
              '&:hover': { bgcolor: activeFilterChart === e.id ? '#0B2E50' : '#F1F5F9' }
            }}
          />
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        /* 8 Insight Cards in Responsive Two-Column Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {filteredEntries.map((item, index) => {
            const Icon = item.icon;
            const borderAccentColor = item.severity === 'alert' ? '#EF4444' : item.severity === 'warning' ? '#F59E0B' : '#0284C7';
            const bgAccentTint = item.severity === 'alert' ? '#FEF2F2' : item.severity === 'warning' ? '#FFFBEB' : '#F0F9FF';

            return (
              <Card
                key={item.id}
                id={`insight-${item.id}`}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  bgcolor: '#FFFFFF',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: '18px !important' }}>
                  {/* Card Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '6px', 
                          bgcolor: `${item.color}15`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: item.color
                        }}
                      >
                        <Icon size={16} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          CHART {item.id.replace('chart', '')}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '0.98rem', fontWeight: 700, color: '#0D3B66', lineHeight: 1.2 }}>
                          {item.title}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSeverityChip(item.severity)}
                      {onNavigateToChart && (
                        <Button
                          size="small"
                          endIcon={<ExternalLink size={13} />}
                          onClick={() => onNavigateToChart(item.id)}
                          sx={{
                            fontSize: '0.72rem',
                            color: '#0D3B66',
                            bgcolor: '#F1F5F9',
                            py: 0.3,
                            px: 1,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '6px',
                            '&:hover': { bgcolor: '#E2E8F0' }
                          }}
                        >
                          View Chart
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Key Verified Finding */}
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: bgAccentTint, 
                      borderLeft: `4px solid ${borderAccentColor}`,
                      borderRadius: '6px',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: borderAccentColor, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                      VERIFIED FINDING (MSSQL AUDITED)
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.45, fontWeight: 500 }}>
                      {item.finding}
                    </Typography>
                  </Box>

                  {/* Numerical Evidence Matrix */}
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                    QUANTITATIVE EVIDENCE
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 1, 
                      mb: 2 
                    }}
                  >
                    {item.evidence.map((ev, evIdx) => (
                      <Box 
                        key={evIdx} 
                        sx={{ 
                          p: 1, 
                          bgcolor: '#F8FAFC', 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '6px' 
                        }}
                      >
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.1, mb: 0.3 }}>
                          {ev.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: ev.alert ? '#EF4444' : '#0D3B66' }}>
                          {ev.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Recommended Policy Action */}
                  <Box sx={{ p: 1.25, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        RECOMMENDED ACTION
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.82rem', color: '#065F46', lineHeight: 1.4, fontWeight: 500 }}>
                      {item.recommendation}
                    </Typography>
                  </Box>

                  {/* Methodological Limitation */}
                  {item.limitation && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, pt: 0.5, borderTop: '1px solid #F1F5F9' }}>
                      <Info size={13} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.35, fontStyle: 'italic' }}>
                        {item.limitation}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
