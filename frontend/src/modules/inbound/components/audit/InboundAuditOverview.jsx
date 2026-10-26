import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Grid, 
  Chip, 
  Button, 
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  Database, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck2, 
  HelpCircle, 
  ExternalLink,
  PhoneCall,
  UserX,
  FileX,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function InboundAuditOverview({ 
  overview = {}, 
  loading = false, 
  onSelectAuditFilter 
}) {
  const kpis = overview?.kpis || {};
  const issues = overview?.issues || [];

  const totalAudited = kpis.totalAudited || 0;
  const uniqueConfirmed = kpis.uniqueConfirmedIssues || 0;
  const confirmedRate = kpis.confirmedIssuesRate || 0;
  const overallQuality = kpis.overallQualityRate || 0;
  const completenessRate = kpis.dataCompletenessRate || 0;
  const reviewCount = kpis.recordsRequiringReview || 0;
  const reviewRate = kpis.reviewRate || 0;

  // Group issues into the three approved categories
  const confirmedIssues = issues.filter(i => i.category === 'Confirmed Completeness Issues');
  const reviewAnomalies = issues.filter(i => i.category === 'Review-Required Anomalies');
  const expectedConditions = issues.filter(i => i.category === 'Expected Operational Conditions');

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2.5,
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* Section Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 800, color: '#0D3B66' }}>
            Data Quality Overview & Telephony Issue Breakdown
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
            Overall health score, confirmed defects, review anomalies, and expected operational telephony behavior
          </Typography>
        </Box>
        <Chip
          label="Live Telemetry Audit"
          size="small"
          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '0.72rem' }}
        />
      </Box>

      {/* TOP: 5 PRIMARY AUDIT KPIS */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {/* KPI 1: Total Records Audited */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Database size={16} color="#0D3B66" />
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Total Audited
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D3B66', fontSize: '1.4rem' }}>
              {totalAudited.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
              Active filtered dataset
            </Typography>
          </Box>
        </Grid>

        {/* KPI 2: Confirmed Quality Issues */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #FECACA',
              bgcolor: '#FEF2F2',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AlertTriangle size={16} color="#DC2626" />
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Confirmed Issues
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '1.4rem' }}>
              {uniqueConfirmed.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#B91C1C', fontSize: '0.7rem', fontWeight: 600 }}>
              {confirmedRate}% of audited calls
            </Typography>
          </Box>
        </Grid>

        {/* KPI 3: Overall Data Quality Rate */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #A7F3D0',
              bgcolor: '#ECFDF5',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ShieldCheck size={16} color="#059669" />
              <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Overall Quality Rate
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', fontSize: '1.4rem' }}>
              {overallQuality}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallQuality}
              sx={{ height: 5, borderRadius: 3, my: 0.75, bgcolor: '#D1FAE5', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
            />
            <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.7rem' }}>
              Zero-defect clean records
            </Typography>
          </Box>
        </Grid>

        {/* KPI 4: Data Completeness Rate */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #BAE6FD',
              bgcolor: '#F0F9FF',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <FileCheck2 size={16} color="#0284C7" />
              <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Completeness Rate
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284C7', fontSize: '1.4rem' }}>
              {completenessRate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={completenessRate}
              sx={{ height: 5, borderRadius: 3, my: 0.75, bgcolor: '#E0F2FE', '& .MuiLinearProgress-bar': { bgcolor: '#0284C7' } }}
            />
            <Typography variant="caption" sx={{ color: '#0284C7', fontSize: '0.7rem' }}>
              Across 10 core schema fields
            </Typography>
          </Box>
        </Grid>

        {/* KPI 5: Records Requiring Review */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #FDE68A',
              bgcolor: '#FFFBEB',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <HelpCircle size={16} color="#D97706" />
              <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Review Required
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', fontSize: '1.4rem' }}>
              {reviewCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#B45309', fontSize: '0.7rem', fontWeight: 600 }}>
              {reviewRate}% classification mismatches
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* IMMEDIATELY BELOW: ISSUE BREAKDOWN ORGANIZED INTO 3 CATEGORIES */}
      <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.75rem' }}>
          Issue Breakdown by Audit Category
        </Typography>

        <Grid container spacing={2}>
          {/* CATEGORY 1: CONFIRMED COMPLETENESS ISSUES */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ p: 1.75, bgcolor: '#FFF5F5', borderRadius: '10px', border: '1px solid #FED7D7', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: '#C53030', fontSize: '0.85rem' }}>
                  Confirmed Completeness Issues
                </Typography>
                <Chip label="Actionable Defects" size="small" sx={{ bgcolor: '#FEB2B2', color: '#9B2C2C', fontSize: '0.65rem', fontWeight: 700 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#742A2A', display: 'block', mb: 1.5 }}>
                Definite data omissions where mandatory wrap-up or agent details are missing on handled calls.
              </Typography>

              {confirmedIssues.map((issue, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: 1,
                    bgcolor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #FED7D7',
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1A202C', fontSize: '0.82rem' }}>
                        {issue.title}
                      </Typography>
                      <Typography sx={{ color: '#718096', fontSize: '0.7rem', lineHeight: 1.3, my: 0.3 }}>
                        {issue.description}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#E53E3E', fontSize: '0.95rem' }}>
                        {issue.count.toLocaleString()}
                      </Typography>
                      <Typography sx={{ color: '#A0AEC0', fontSize: '0.68rem', fontWeight: 600 }}>
                        {issue.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowRight size={13} />}
                    onClick={() => onSelectAuditFilter && onSelectAuditFilter(issue.ruleId === 'R3' ? 'unexpected_agent' : issue.ruleId === 'R4' ? 'missing_disp' : 'missing_sub_disp')}
                    sx={{
                      p: 0,
                      mt: 0.5,
                      textTransform: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#C53030',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                  >
                    Inspect {issue.count.toLocaleString()} Records
                  </Button>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* CATEGORY 2: REVIEW-REQUIRED ANOMALIES */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ p: 1.75, bgcolor: '#FFFDF5', borderRadius: '10px', border: '1px solid #FEF08A', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: '#B45309', fontSize: '0.85rem' }}>
                  Review-Required Anomalies
                </Typography>
                <Chip label="Requires Verification" size="small" sx={{ bgcolor: '#FDE047', color: '#713F12', fontSize: '0.65rem', fontWeight: 700 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#92400E', display: 'block', mb: 1.5 }}>
                Threshold and classification discrepancies that represent possible telephony transfer or recording lags.
              </Typography>

              {reviewAnomalies.map((issue, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: 1,
                    bgcolor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #FEF08A',
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1A202C', fontSize: '0.82rem' }}>
                        {issue.title}
                      </Typography>
                      <Typography sx={{ color: '#718096', fontSize: '0.7rem', lineHeight: 1.3, my: 0.3 }}>
                        {issue.description}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>
                        {issue.count.toLocaleString()}
                      </Typography>
                      <Typography sx={{ color: '#A0AEC0', fontSize: '0.68rem', fontWeight: 600 }}>
                        {issue.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowRight size={13} />}
                    onClick={() => onSelectAuditFilter && onSelectAuditFilter('mismatch')}
                    sx={{
                      p: 0,
                      mt: 0.5,
                      textTransform: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#B45309',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                  >
                    Inspect {issue.count.toLocaleString()} Mismatches
                  </Button>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* CATEGORY 3: EXPECTED OPERATIONAL CONDITIONS */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ p: 1.75, bgcolor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.85rem' }}>
                  Expected Operational Conditions
                </Typography>
                <Chip label="Normal Telephony" size="small" sx={{ bgcolor: '#86EFAC', color: '#14532D', fontSize: '0.65rem', fontWeight: 700 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 1.5 }}>
                Legitimate operational conditions resulting from telephony queue behavior (NOT classified as data defects).
              </Typography>

              {expectedConditions.map((issue, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: 1,
                    bgcolor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1A202C', fontSize: '0.82rem' }}>
                        {issue.title}
                      </Typography>
                      <Typography sx={{ color: '#718096', fontSize: '0.7rem', lineHeight: 1.3, my: 0.3 }}>
                        {issue.description}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#16A34A', fontSize: '0.95rem' }}>
                        {issue.count.toLocaleString()}
                      </Typography>
                      <Typography sx={{ color: '#A0AEC0', fontSize: '0.68rem', fontWeight: 600 }}>
                        {issue.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowRight size={13} />}
                    onClick={() => onSelectAuditFilter && onSelectAuditFilter('expected_queue')}
                    sx={{
                      p: 0,
                      mt: 0.5,
                      textTransform: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#15803D',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                  >
                    Inspect {issue.count.toLocaleString()} Queue Drops
                  </Button>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
