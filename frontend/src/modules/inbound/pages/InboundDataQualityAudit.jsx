import React, { useRef, useCallback } from 'react';
import { Box, Alert, AlertTitle, CircularProgress } from '@mui/material';
import InboundAuditHeader from '../components/audit/InboundAuditHeader';
import InboundFilterBar from '../components/InboundFilterBar';
import InboundAuditOverview from '../components/audit/InboundAuditOverview';
import InboundFieldCompletenessMatrix from '../components/audit/InboundFieldCompletenessMatrix';
import InboundStatusConsistencyAudit from '../components/audit/InboundStatusConsistencyAudit';
import InboundDataQualityTrendChart from '../components/audit/InboundDataQualityTrendChart';
import InboundFlaggedCallsTable from '../components/audit/InboundFlaggedCallsTable';
import InboundAuditRuleDefinitions from '../components/audit/InboundAuditRuleDefinitions';
import { useInboundAudit } from '../hooks/useInboundAudit';
import { useInboundFlaggedCalls } from '../hooks/useInboundFlaggedCalls';

export default function InboundDataQualityAudit() {
  const {
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
    refresh
  } = useInboundAudit();

  const flaggedCallsHook = useInboundFlaggedCalls(filters);
  const flaggedSectionRef = useRef(null);

  const handleSelectRuleFilter = useCallback((ruleId) => {
    let targetRule = 'all';
    if (ruleId === 'R1' || ruleId === 'missing_disp') targetRule = 'missing_disp';
    else if (ruleId === 'R2' || ruleId === 'missing_sub_disp') targetRule = 'missing_sub_disp';
    else if (ruleId === 'R3' || ruleId === 'unexpected_agent') targetRule = 'unexpected_agent';
    else if (ruleId === 'R4' || ruleId === 'R5' || ruleId === 'mismatch') targetRule = 'mismatch';
    else if (ruleId === 'confirmed') targetRule = 'confirmed';
    else if (ruleId === 'review') targetRule = 'review';

    flaggedCallsHook.setAuditRule(targetRule);
    flaggedCallsHook.setPage(1);

    if (flaggedSectionRef.current) {
      flaggedSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [flaggedCallsHook]);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        bgcolor: '#F8FAFC',
        minHeight: '100%',
        maxWidth: 1600,
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header with Refresh */}
      <InboundAuditHeader loading={loading} onRefresh={refresh} />

      {/* 2. Global Audit Filters */}
      <InboundFilterBar
        filters={filters}
        options={filterOptions}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Error Feedback */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Telemetry Audit Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* 3. Section C: Combined Overview KPIs & Issue Categorization */}
      <InboundAuditOverview
        overview={overview}
        loading={loading}
        onSelectAuditFilter={handleSelectRuleFilter}
      />

      {/* 4. Section D: Field Completeness Matrix */}
      <InboundFieldCompletenessMatrix
        items={fieldCompleteness}
        loading={loading}
      />

      {/* 5. Section E: Call Status Consistency Audit */}
      <InboundStatusConsistencyAudit
        consistency={consistency}
        onSelectFilter={handleSelectRuleFilter}
      />

      {/* 6. Section F: Monthly Data Quality Trend */}
      <InboundDataQualityTrendChart
        trend={trend}
        loading={loading}
      />

      {/* 7. Section G: Flagged Call Records Explorer */}
      <Box ref={flaggedSectionRef} sx={{ scrollMarginTop: '20px' }}>
        <InboundFlaggedCallsTable
          flaggedHook={flaggedCallsHook}
        />
      </Box>

      {/* 8. Section H: Audit Rule Definitions */}
      <InboundAuditRuleDefinitions rules={rules} />
    </Box>
  );
}
