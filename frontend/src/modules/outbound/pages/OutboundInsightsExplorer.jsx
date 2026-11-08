import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Lightbulb,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

import OutboundFilterBar from '../components/OutboundFilterBar';
import OutboundInsightCard from '../components/insights/OutboundInsightCard';
import OutboundExecutiveSummary from '../components/OutboundExecutiveSummary';
import { useOutboundInsights } from '../hooks/useOutboundInsights';

export default function OutboundInsightsExplorer({
  targetSection,
  targetChart,
  onNavigateToChart,
  onNavigateToDashboard,
  filters: propFilters,
  onFilterChange: propUpdateFilter,
  onResetFilters: propResetFilters
}) {
  const {
    filters,
    filterOptions,
    data,
    insights,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh
  } = useOutboundInsights(propFilters, propUpdateFilter, propResetFilters);

  const [activeFilterSection, setActiveFilterSection] = useState('all');

  // Smooth scroll and blue pulse highlight when targetSection or targetChart is specified
  useEffect(() => {
    const target = targetSection || targetChart;
    if (target && !loading && data) {
      const timer = setTimeout(() => {
        let el = document.getElementById(target.toLowerCase());
        if (!el) {
          el = document.getElementById(`insight-${target.toLowerCase()}`);
        }
        if (!el) {
          if (target === 'summary' || target === 'executive-summary' || target === 'section-executive-summary' || target === 'sec7-audit') {
            el = document.getElementById('section-executive-summary');
          } else {
            const matchedInsight = insights.find(
              (i) => i.id.toLowerCase() === target.toLowerCase() ||
                     i.chartKey?.toLowerCase() === target.toLowerCase()
            );
            if (matchedInsight) {
              el = document.getElementById(`insight-${matchedInsight.id}`);
            }
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
  }, [targetSection, targetChart, loading, data, insights]);

  const filteredEntries =
    activeFilterSection === 'all'
      ? insights
      : insights.filter((e) => e.id === activeFilterSection);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2.5, md: 3 },
        maxWidth: 1600,
        mx: 'auto',
        bgcolor: '#F8FAFC',
        minHeight: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0D3B66',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Outbound Insights Explorer
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
            Comprehensive Outbound Campaign Telemetry, Connection Rate Dynamics, Agent Conversions, and Shift Intelligence for PM-JAY
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh Telemetry from SQL Server">
            <IconButton
              onClick={refresh}
              disabled={loading}
              sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 0.8 }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          {onNavigateToDashboard && (
            <Button
              variant="outlined"
              size="small"
              onClick={onNavigateToDashboard}
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
              Return to Outbound Dashboard
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Global Outbound Filter Bar */}
      <OutboundFilterBar
        filters={filters}
        options={filterOptions}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* 3. Quick Section Filter Pills */}
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
          label="All 7 Analytical Sections"
          size="small"
          onClick={() => setActiveFilterSection('all')}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            bgcolor: activeFilterSection === 'all' ? '#0D3B66' : '#FFFFFF',
            color: activeFilterSection === 'all' ? '#FFFFFF' : '#475569',
            border: '1px solid',
            borderColor: activeFilterSection === 'all' ? '#0D3B66' : '#E2E8F0',
            '&:hover': { bgcolor: activeFilterSection === 'all' ? '#0B2E50' : '#F1F5F9' }
          }}
        />
        <Chip
          label="Executive Summary"
          size="small"
          onClick={() => setActiveFilterSection('summary')}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            bgcolor: activeFilterSection === 'summary' ? '#0284C7' : '#FFFFFF',
            color: activeFilterSection === 'summary' ? '#FFFFFF' : '#475569',
            border: '1px solid',
            borderColor: activeFilterSection === 'summary' ? '#0284C7' : '#E2E8F0',
            '&:hover': { bgcolor: activeFilterSection === 'summary' ? '#0369A1' : '#F1F5F9' }
          }}
        />
        {insights.map((sec) => (
          <Chip
            key={sec.id}
            label={sec.category}
            size="small"
            onClick={() => setActiveFilterSection(sec.id)}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              bgcolor: activeFilterSection === sec.id ? '#0284C7' : '#FFFFFF',
              color: activeFilterSection === sec.id ? '#FFFFFF' : '#475569',
              border: '1px solid',
              borderColor: activeFilterSection === sec.id ? '#0284C7' : '#E2E8F0',
              '&:hover': { bgcolor: activeFilterSection === sec.id ? '#0369A1' : '#F1F5F9' }
            }}
          />
        ))}
      </Box>

      {/* 4. Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            (error.toLowerCase().includes('unauthorized') ||
             error.toLowerCase().includes('401') ||
             error.toLowerCase().includes('session')) ? (
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => window.dispatchEvent(new CustomEvent('auth:unauthorized'))}
                sx={{ fontWeight: 700, textTransform: 'none', ml: 1 }}
              >
                Sign In Now
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}

      {/* 5. Loading State */}
      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={36} color="primary" />
        </Box>
      ) : (
        <Box>
          {/* Executive Business Summary Panel (Preserved in full and placed in Insights Explorer) */}
          {(activeFilterSection === 'all' || activeFilterSection === 'summary') && data?.executiveSummary && (
            <Box id="section-executive-summary" sx={{ mb: 2.5 }}>
              <OutboundExecutiveSummary summary={data.executiveSummary} />
            </Box>
          )}

          {/* List of Analytical Insight Cards */}
          {activeFilterSection !== 'summary' &&
            filteredEntries.map((insight) => (
              <OutboundInsightCard
                key={insight.id}
                insight={insight}
                onNavigateToChart={onNavigateToChart}
              />
            ))}
        </Box>
      )}
    </Box>
  );
}
