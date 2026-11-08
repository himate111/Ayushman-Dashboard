import React from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  Percent,
  Clock,
  Timer,
  RefreshCw
} from 'lucide-react';

import { useOutboundDashboard } from '../hooks/useOutboundDashboard';
import OutboundKpiCard from '../components/OutboundKpiCard';
import OutboundFilterBar from '../components/OutboundFilterBar';

// 7 Analytical Sections (10 Chart Cards in 2-Column Grid)
import OutboundYearCard from '../charts/OutboundYearCard';
import OutboundMonthlyStackedCard from '../charts/OutboundMonthlyStackedCard';
import OutboundGroupCard from '../charts/OutboundGroupCard';
import OutboundOutcomeCard from '../charts/OutboundOutcomeCard';
import OutboundSubDispositionCard from '../charts/OutboundSubDispositionCard';
import OutboundShiftCard from '../charts/OutboundShiftCard';
import OutboundWastedCard from '../charts/OutboundWastedCard';
import OutboundAgentPerformanceCard from '../charts/OutboundAgentPerformanceCard';

export default function OutboundExecutiveDashboard({
  onNavigateToInsights,
  targetChart,
  filters: propFilters,
  onFilterChange: propUpdateFilter,
  onResetFilters: propResetFilters
}) {
  const {
    filters,
    filterOptions,
    data,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh
  } = useOutboundDashboard(propFilters, propUpdateFilter, propResetFilters);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const executiveSummary = data?.executiveSummary;

  // Derive the latest genuine uploaded call-data month from the baseline/import dataset
  const fullDatasetBoundary = React.useMemo(() => {
    const raw = charts?.callsByMonth || [];
    const valid = raw.filter((d) => Number(d.totalCalls || 0) > 0);
    if (valid.length === 0) return null;
    let maxVal = -1;
    let best = null;
    for (const r of valid) {
      const y = Number(r.year || 0);
      const m = Number(r.monthNumber) || 0;
      const val = y * 12 + m;
      if (val > maxVal) {
        maxVal = val;
        best = { year: y, month: m };
      }
    }
    return best;
  }, [charts?.callsByMonth]);

  // Auto-scroll and highlight target chart when targetChart prop is provided
  React.useEffect(() => {
    if (targetChart && !loading && data) {
      const timer = setTimeout(() => {
        let el = document.getElementById(targetChart);
        if (!el) {
          el = document.getElementById(`chart-${targetChart.toLowerCase()}`);
        }
        if (!el) {
          if (targetChart === 'top-agents' || targetChart === 'agents' || targetChart === 'sec6-agents') {
            el = document.getElementById('chart-top-agents');
          } else if (targetChart === 'bottom-agents') {
            el = document.getElementById('chart-bottom-agents');
          } else if (targetChart === 'shift-volume' || targetChart === 'shifts' || targetChart === 'sec5-shifts') {
            el = document.getElementById('chart-calls-by-shift');
          } else if (targetChart === 'wasted-attempts') {
            el = document.getElementById('chart-wasted-attempts');
          } else if (targetChart === 'groups' || targetChart === 'sec3-campaigns') {
            el = document.getElementById('chart-group-distribution');
          } else if (targetChart === 'outcomes' || targetChart === 'sec2-outcomes') {
            el = document.getElementById('chart-outcome-mix');
          } else if (targetChart === 'sec1-volume' || targetChart === 'volume') {
            el = document.getElementById('chart-calls-by-year');
          } else if (targetChart === 'sec4-dispositions') {
            el = document.getElementById('chart-top-sub-dispositions');
          } else if (targetChart === 'executive-summary' || targetChart === 'sec7-audit') {
            el = document.getElementById('section-executive-summary');
          }
        }
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

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 3px #0284C7, 0 10px 25px -5px rgba(2, 132, 199, 0.25)';
      el.style.borderRadius = '10px';
      el.style.transition = 'all 0.4s ease';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2500);
    }
  };

  const handleViewInsight = (sectionKey) => {
    if (onNavigateToInsights) {
      onNavigateToInsights(sectionKey);
    } else {
      handleScrollToSection('section-executive-summary');
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        bgcolor: '#F8FAFC',
        minHeight: '100%',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* =========================================================================
          SECTION 1: Page Title, Subtitle, Telemetry Refresh Button & Filter Bar
          ========================================================================= */}
      <Box sx={{ mb: 2 }}>
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
              flex: '1 1 auto'
            }}
          >
            Outbound Call Center Performance Intelligence
          </Typography>

          <Tooltip title="Refresh Outbound Telemetry" placement="top">
            <IconButton
              onClick={refresh}
              disabled={loading}
              size="small"
              aria-label="Refresh Outbound Telemetry"
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
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748B', fontSize: { xs: '12px', sm: '13px' } }}>
          National Health Authority (NHA) PM-JAY Outbound Campaign Engagement, Agent Conversions & Call Disposition Intelligence
        </Typography>
      </Box>

      {/* Filter Bar */}
      <OutboundFilterBar
        filters={filters}
        options={filterOptions}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Error alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2.5, alignItems: 'center' }}
          action={
            (error.toLowerCase().includes('unauthorized') || 
             error.toLowerCase().includes('401') || 
             error.toLowerCase().includes('session') ||
             error.toLowerCase().includes('sign in')) ? (
              <Button 
                color="inherit" 
                size="small" 
                variant="outlined"
                onClick={() => window.dispatchEvent(new CustomEvent('auth:unauthorized'))}
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  borderColor: 'currentColor', 
                  ml: 1,
                  px: 1.5,
                  py: 0.25
                }}
              >
                Sign In Now
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && !data?.kpis?.totalCalls ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {/* =========================================================================
              SECTION 2: All 7 Original Outbound KPI Cards (Aligned in 1 Single Row)
              ========================================================================= */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
                lg: 'repeat(7, minmax(0, 1fr))'
              },
              gap: '9px',
              mb: '14px'
            }}
          >
            {/* KPI 1: Total Calls */}
            <OutboundKpiCard
              title="Total Calls"
              value={kpis.totalCalls?.toLocaleString() ?? '—'}
              subtitle="All campaign attempts"
              tooltip="Total volume of outbound calls registered across all campaigns"
              icon={PhoneCall}
              color="#0D3B66"
              bgLight="#E0F2FE"
            />

            {/* KPI 2: Connected Calls */}
            <OutboundKpiCard
              title="Connected Calls"
              value={kpis.connectedCalls?.toLocaleString() ?? '—'}
              subtitle="Agent talk ≥ 3s"
              tooltip="Outbound calls successfully answered with agent talk time of 3 seconds or longer"
              rate={kpis.connectionRate}
              rateLabel="conn."
              icon={PhoneForwarded}
              color="#2F7D4F"
              bgLight="#D1FAE5"
            />

            {/* KPI 3: Connection Rate */}
            <OutboundKpiCard
              title="Connection Rate"
              value={`${kpis.connectionRate || 0}%`}
              subtitle="Connected / Total"
              tooltip="Percentage of dialed outbound attempts that successfully reached a beneficiary"
              icon={Percent}
              color="#8B5CF6"
              bgLight="#EDE9FE"
            />

            {/* KPI 4: Not Connected Calls */}
            <OutboundKpiCard
              title="Not Connected"
              value={kpis.notConnectedCalls?.toLocaleString() ?? '—'}
              subtitle="Agent talk < 3s"
              tooltip="Calls dropped, busy, unreachable, or ending before the 3-second threshold"
              rate={kpis.notConnectedPercentage}
              rateLabel="rate"
              icon={PhoneOff}
              color="#C44949"
              bgLight="#FEE2E2"
            />

            {/* KPI 5: Not Connected Percentage */}
            <OutboundKpiCard
              title="Not Connected %"
              value={`${kpis.notConnectedPercentage || 0}%`}
              subtitle="Unsuccessful attempts"
              tooltip="Percentage of dialed outbound calls that did not connect with a beneficiary"
              icon={Percent}
              color="#EF4444"
              bgLight="#FEE2E2"
            />

            {/* KPI 6: Average Total Duration */}
            <OutboundKpiCard
              title="Avg Total Duration"
              value={kpis.avgCallDuration || '00:00:00'}
              subtitle="Total session elapsed"
              tooltip="Average elapsed time from initial dial to final disconnection"
              icon={Clock}
              color="#235789"
              bgLight="#E0F2FE"
            />

            {/* KPI 7: Average Talk Time */}
            <OutboundKpiCard
              title="Avg Talk Time"
              value={kpis.avgAgentDuration || '00:00:00'}
              subtitle="Active talk duration"
              tooltip="Average conversational talk time between agent and beneficiary"
              icon={Timer}
              color="#0D9488"
              bgLight="#CCFBF1"
            />
          </Box>

          {/* =========================================================================
              SECTIONS 3 to 7: Balanced 2-Column Responsive Chart Cards
              ========================================================================= */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))'
              },
              gap: '14px',
              mb: '14px'
            }}
          >
            {/* SECTION 3 (Left): Calls by Year */}
            <Box id="chart-calls-by-year">
              <OutboundYearCard
                data={charts.callsByYear || []}
                kpis={kpis}
                filters={filters}
                onViewInsight={() => handleViewInsight('sec1-volume')}
              />
            </Box>

            {/* SECTION 3 (Right): Calls by Month */}
            <Box id="chart-calls-by-month">
              <OutboundMonthlyStackedCard
                data={charts.callsByMonth || []}
                fullDatasetDateBoundary={fullDatasetBoundary}
                filters={filters}
                onViewInsight={() => handleViewInsight('sec1-volume')}
              />
            </Box>

            {/* SECTION 4 (Left): Outbound Call Name Distribution */}
            <Box id="chart-group-distribution">
              <OutboundGroupCard
                data={charts.groups || []}
                onViewInsight={() => handleViewInsight('sec3-campaigns')}
              />
            </Box>

            {/* SECTION 4 (Right): Call Outcome Distribution */}
            <Box id="chart-outcome-mix">
              <OutboundOutcomeCard
                data={charts.outcomeMix || []}
                onViewInsight={() => handleViewInsight('sec2-outcomes')}
              />
            </Box>

            {/* SECTION 5 (Left): Top 5 Connected Sub-Dispositions */}
            <Box id="chart-top-sub-dispositions">
              <OutboundSubDispositionCard
                title="Top 5 Connected Sub-Disposition"
                subtitle="Most Frequent Resolved Outcomes on Connected Calls"
                data={charts.topSubDispositions || []}
                color="#16A34A"
                onViewInsight={() => handleViewInsight('sec4-dispositions')}
              />
            </Box>

            {/* SECTION 5 (Right): Bottom 5 Connected Sub-Dispositions */}
            <Box id="chart-bottom-sub-dispositions">
              <OutboundSubDispositionCard
                title="Bottom 5 Connected Sub-Disposition"
                subtitle="Least Frequent Resolved Outcomes on Connected Calls"
                data={charts.bottomSubDispositions || []}
                color="#94A3B8"
                onViewInsight={() => handleViewInsight('sec4-dispositions')}
              />
            </Box>

            {/* SECTION 6 (Left): Calls by Shift */}
            <Box id="chart-calls-by-shift">
              <OutboundShiftCard
                data={charts.shifts || []}
                onViewInsight={() => handleViewInsight('sec5-shifts')}
              />
            </Box>

            {/* SECTION 6 (Right): Wasted Attempts */}
            <Box id="chart-wasted-attempts">
              <OutboundWastedCard
                data={charts.wastedAttempts || []}
                onViewInsight={() => handleViewInsight('sec5-shifts')}
              />
            </Box>

            {/* SECTION 7 (Left): Top 5 Agents */}
            <Box id="chart-top-agents">
              <OutboundAgentPerformanceCard
                title="Top 5 Agents"
                subtitle="Highest Volume Outbound Responders (Total vs. Connected)"
                data={charts.topAgents || []}
                isBottomAgents={false}
                onViewInsight={() => handleViewInsight('sec6-agents')}
              />
            </Box>

            {/* SECTION 7 (Right): Bottom 5 Agents */}
            <Box id="chart-bottom-agents">
              <OutboundAgentPerformanceCard
                title="Bottom 5 Agents by Connection Rate (Minimum 100 Calls)"
                subtitle="Lowest Connection Conversion among Active Dialers (≥ 100 Calls)"
                data={charts.bottomAgents || []}
                isBottomAgents={true}
                onViewInsight={() => handleViewInsight('sec6-agents')}
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
