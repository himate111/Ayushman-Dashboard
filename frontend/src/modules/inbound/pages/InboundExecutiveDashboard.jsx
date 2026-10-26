import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Clock,
  UserCheck,
  RefreshCw
} from 'lucide-react';

import { useInboundDashboard } from '../hooks/useInboundDashboard';
import InboundKpiCard from '../components/InboundKpiCard';
import InboundFilterBar from '../components/InboundFilterBar';

// 14 Inbound Visualizations
import CallsByYearChart from '../charts/CallsByYearChart';
import CallsByMonthChart from '../charts/CallsByMonthChart';
import CallEndingPointChart from '../charts/CallEndingPointChart';
import GroupDistributionChart from '../charts/GroupDistributionChart';
import DispositionDistributionChart from '../charts/DispositionDistributionChart';
import SubDispositionChart from '../charts/SubDispositionChart';
import IncomingCallsByHourChart from '../charts/IncomingCallsByHourChart';
import ConnectedCallsByHourChart from '../charts/ConnectedCallsByHourChart';
import AbandonedCallsByHourChart from '../charts/AbandonedCallsByHourChart';
import CallDropRateByHourChart from '../charts/CallDropRateByHourChart';
import ShiftVolumeChart from '../charts/ShiftVolumeChart';
import ShiftComparisonChart from '../charts/ShiftComparisonChart';
import TopAgentsChart from '../charts/TopAgentsChart';
import BottomAgentsChart from '../charts/BottomAgentsChart';

export default function InboundExecutiveDashboard({
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
  } = useInboundDashboard(propFilters, propUpdateFilter, propResetFilters);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  // Scroll to chart if targetChart is specified
  React.useEffect(() => {
    if (targetChart && !loading && data) {
      const timer = setTimeout(() => {
        let el = document.getElementById(`chart-${targetChart.toLowerCase()}`);
        if (!el) {
          if (targetChart === 'top-agents' || targetChart === 'agents') {
            el = document.getElementById('chart-agents');
          } else if (targetChart === 'shift-volume' || targetChart === 'shifts') {
            el = document.getElementById('chart-shifts');
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

  const handleViewInsight = (sectionKey) => {
    if (onNavigateToInsights) {
      onNavigateToInsights(sectionKey);
    }
  };

  // Shift comparisons computation matching original logic
  const shiftComparison = useMemo(() => {
    if (!charts.connectedByShift) return [];
    return charts.connectedByShift.map((item, idx) => ({
      name: item.name,
      connected: item.value,
      abandoned: charts.notConnectedByShift?.[idx]?.value || 0
    }));
  }, [charts.connectedByShift, charts.notConnectedByShift]);

  const shiftsWithPercent = useMemo(() => {
    if (!charts.shifts) return [];
    const total = charts.shifts.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    return charts.shifts.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  }, [charts.shifts]);

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
      {/* 1. Header Section */}
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
            Inbound Call Center Performance Intelligence
          </Typography>

          <Tooltip title="Refresh Inbound Telemetry" placement="top">
            <IconButton
              onClick={refresh}
              disabled={loading}
              size="small"
              aria-label="Refresh Inbound Telemetry"
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
          National Health Authority (NHA) PM-JAY Call Center Redressal, Agent Utilization, and Real-time Traffic Surveillance
        </Typography>
      </Box>

      {/* 2. Inbound Filter Bar */}
      <InboundFilterBar
        filters={filters}
        options={filterOptions}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* 3. Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {/* 4. Loading or Content */}
      {loading && !data?.kpis?.totalCalls ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {/* 5. Executive KPI Cards — 5 Cards in ONE Horizontal Row on Desktop */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(5, minmax(0, 1fr))'
              },
              gap: '9px',
              mb: '14px'
            }}
          >
            <InboundKpiCard
              title="Total Inbound Calls"
              value={kpis.totalCalls || 0}
              subtitle="Total registered traffic"
              tooltip="Total volume of inbound calls registered in the PBX telephony switch"
              icon={PhoneCall}
              color="#0D3B66"
              bgLight="#E0F2FE"
            />

            <InboundKpiCard
              title="Connected Calls"
              value={kpis.connectedCalls || 0}
              subtitle="Agent talk ≥ 3s"
              tooltip="Calls successfully connected with agent talk duration of 3 seconds or longer"
              rate={kpis.connectionRate}
              rateLabel="conn."
              icon={PhoneIncoming}
              color="#2F7D4F"
              bgLight="#D1FAE5"
            />

            <InboundKpiCard
              title="Abandoned / Early Ended"
              value={kpis.notConnectedCalls || 0}
              subtitle="Agent talk < 3s"
              tooltip="Telephony queue drops, IVR abandonments, and calls ending with agent under 3s (3-second duration threshold)"
              rate={kpis.notConnectedPercentage}
              rateLabel="rate"
              icon={PhoneOff}
              color="#C44949"
              bgLight="#FEE2E2"
            />

            <InboundKpiCard
              title="Avg Call Duration"
              value={kpis.avgCallDuration || '0s'}
              subtitle="Total session elapsed"
              tooltip="Average elapsed time from initial call arrival to final disconnect across all calls"
              icon={Clock}
              color="#235789"
              bgLight="#E0F2FE"
            />

            <InboundKpiCard
              title="Avg Agent Duration"
              value={kpis.avgAgentDuration || '0s'}
              subtitle="Active talk time"
              tooltip="Average active conversational talk time on connected agent calls"
              icon={UserCheck}
              color="#0D9488"
              bgLight="#CCFBF1"
            />
          </Box>

          {/* 6. All 14 Inbound Visualizations in a Consistent 2-Column Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))'
              },
              gap: '14px'
            }}
          >
            {/* Row 1: Calls by Year & Calls by Month */}
            <Box id="chart-calls-by-year">
              <CallsByYearChart data={charts.callsByYear || []} onViewInsight={() => handleViewInsight('sec1-volume')} />
            </Box>
            <Box id="chart-calls-by-month">
              <CallsByMonthChart data={charts.callsByMonth || []} onViewInsight={() => handleViewInsight('sec1-volume')} />
            </Box>

            {/* Row 2: Call Ending Point & Group Distribution */}
            <Box id="chart-call-end">
              <CallEndingPointChart data={charts.callEnd || []} onViewInsight={() => handleViewInsight('sec2-outcomes')} />
            </Box>
            <Box id="chart-groups">
              <GroupDistributionChart data={charts.groups || []} onViewInsight={() => handleViewInsight('sec4-groups')} />
            </Box>

            {/* Row 3: Disposition Distribution & Top 5 Sub Dispositions */}
            <Box id="chart-dispositions">
              <DispositionDistributionChart data={charts.dispositions || []} onViewInsight={() => handleViewInsight('sec5-dispositions')} />
            </Box>
            <Box id="chart-top-sub-dispositions">
              <SubDispositionChart data={charts.topSubDispositions || []} onViewInsight={() => handleViewInsight('sec5-dispositions')} />
            </Box>

            {/* Row 4: Incoming Calls by Hour & Connected Calls by Hour */}
            <Box id="chart-hourly">
              <IncomingCallsByHourChart data={charts.hourly || []} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>
            <Box id="chart-connected-hourly">
              <ConnectedCallsByHourChart data={charts.hourly || []} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>

            {/* Row 5: Abandoned Calls by Hour & Call Drop Rate by Hour */}
            <Box id="chart-abandoned-hourly">
              <AbandonedCallsByHourChart data={charts.hourly || []} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>
            <Box id="chart-drop-rate-hourly">
              <CallDropRateByHourChart data={charts.hourly || []} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>

            {/* Row 6: Calls Per Shift & Shift Connected vs Abandoned */}
            <Box id="chart-shifts">
              <ShiftVolumeChart data={shiftsWithPercent} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>
            <Box id="chart-shift-comparison">
              <ShiftComparisonChart data={shiftComparison} onViewInsight={() => handleViewInsight('sec3-shifts')} />
            </Box>

            {/* Row 7: Top 10 Agents & Bottom 10 Agents */}
            <Box id="chart-agents">
              <TopAgentsChart data={charts.topAgents || []} onViewInsight={() => handleViewInsight('sec6-agents')} />
            </Box>
            <Box id="chart-bottom-agents">
              <BottomAgentsChart data={charts.bottomAgents || []} onViewInsight={() => handleViewInsight('sec6-agents')} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
