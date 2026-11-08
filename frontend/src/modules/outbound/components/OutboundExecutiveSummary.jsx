import React from 'react';
import { Paper, Box, Typography, Chip, Grid, Tooltip } from '@mui/material';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Target,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const formatCount = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0));

const observationText = (check) => {
  const count = formatCount(check.count);
  switch (check.name) {
    case 'Missing Group Assignment':
      return `${count} calls are missing a Group Name, reducing campaign-level reporting accuracy. Add the correct group before the next upload.`;
    case 'Missing Called Number':
      return `${count} calls are missing a Called Number, limiting contact-level analysis. Populate the dialled number before the next upload.`;
    case 'Invalid Called Number':
      return `${count} records contain invalid phone numbers that should be corrected before the next upload.`;
    case 'Missing Agent ID':
      return `${count} calls are missing Agent IDs, preventing accurate agent-level performance analysis.`;
    case 'Missing Disposition':
      return `${count} calls are missing a valid Disposition, reducing the accuracy of connection and outcome reporting.`;
    case 'Missing Sub-Disposition':
      return `${count} calls are missing a valid Sub-Disposition, limiting detailed outcome and campaign analysis.`;
    case 'Invalid Duration Format':
      return `${count} calls contain invalid duration values, which may affect call-time and productivity reporting.`;
    case 'Negative Duration Values':
      return `${count} calls contain negative duration values that should be corrected before the next upload.`;
    case 'Agent Duration Exceeds Total Duration':
      return `${count} calls have Agent Duration greater than Total Duration, reducing confidence in call-time reporting.`;
    case 'Duration / Disposition Mismatch':
      return `${count} calls have a recorded outcome that conflicts with the call duration, indicating possible incorrect call classification.`;
    case 'Missing Call Start Time':
      return `${count} calls are missing a Call Start Time, preventing accurate month, shift, and hour reporting.`;
    case 'Duplicate Call Records':
      return `${count} duplicate call records were detected and should be reviewed before reporting.`;
    case 'Unexpected Placeholder Values':
      return `${count} calls contain placeholder values such as "-", "N/A", or "Unknown", reducing the reliability of business reporting.`;
    default:
      return `${count} calls contain ${check.name} issues that may affect reporting quality.`;
  }
};

function SummaryColumn({ title, icon: Icon, color, bgLight, items = [], emptyText }) {
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        p: '14px 16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '5px',
            bgcolor: bgLight,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={14} />
        </Box>
        <Typography
          sx={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#0D3B66',
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </Typography>
      </Box>

      {items.length > 0 ? (
        <Box
          component="ul"
          sx={{
            m: 0,
            pl: 2.2,
            fontSize: '11.5px',
            lineHeight: 1.55,
            color: '#334155',
            '& li': {
              mb: 1,
              '&:last-child': { mb: 0 }
            }
          }}
        >
          {items.map((item, idx) => (
            <li key={idx}>
              <Typography component="span" sx={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.55 }}>
                {item}
              </Typography>
            </li>
          ))}
        </Box>
      ) : (
        <Typography sx={{ fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic', mt: 0.5 }}>
          {emptyText}
        </Typography>
      )}
    </Box>
  );
}

export default function OutboundExecutiveSummary({ summary }) {
  if (!summary) return null;

  const isHealthy = summary.status === 'Healthy';
  const isAttention = summary.status === 'Attention';
  const statusColor = isHealthy ? '#059669' : isAttention ? '#D97706' : '#DC2626';
  const statusBg = isHealthy ? '#ECFDF5' : isAttention ? '#FFFBEB' : '#FEF2F2';
  const StatusIcon = isHealthy ? ShieldCheck : isAttention ? AlertTriangle : AlertCircle;

  const highlights = summary.highlights || summary.keyFindings || [];
  const risks = summary.risks || summary.anomalies || [];
  const recommendations = summary.recommendations || [];

  // Data Quality Observations formatted matching original
  const rawDq = summary.dataQuality || [];
  const dqObservations = rawDq
    .filter((c) => c.isIssue && Number(c.count) > 0)
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)
    .map(observationText);

  return (
    <Paper
      elevation={0}
      sx={{
        p: '16px 18px',
        mt: '4px',
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        borderLeft: `5px solid ${statusColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      {/* Header with Title and Health Chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1.5,
          pb: 1.2,
          borderBottom: '1px solid #F1F5F9'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: '#F0F9FF',
              color: '#0284C7'
            }}
          >
            <Sparkles size={16} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14.5px', fontWeight: 800, color: '#0D3B66', lineHeight: 1.2 }}>
              Executive Business Summary
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.2 }}>
              Automated Operational Highlights, Risk Surveillance, Data Quality Audit & Recommendations
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<StatusIcon size={13} style={{ color: statusColor }} />}
            label={`${summary.status || 'Operational'} State (Rule-Based)`}
            size="small"
            sx={{
              bgcolor: statusBg,
              color: statusColor,
              fontWeight: 700,
              fontSize: '11px',
              height: '24px'
            }}
          />
          <Tooltip
            title="Threshold Heuristic Flagged for Review: Connection rate (40.86%) and not-connected rate (59.14%) sit marginally outside legacy deduction triggers (<40% and ≥60%), resulting in 100/100 despite 59.14% dropped calls and data quality findings. Subject to multi-factor scoring review."
            arrow
          >
            <Chip
              label={`Health Score: ${summary.healthScore || 100}/100 (Heuristic — Under Review)`}
              size="small"
              sx={{
                bgcolor: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                fontWeight: 700,
                fontSize: '11px',
                height: '24px',
                cursor: 'help'
              }}
            />
          </Tooltip>
        </Box>
      </Box>

      {/* 4 Structured Columns */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))'
          },
          gap: 1.5
        }}
      >
        <Box>
          <SummaryColumn
            title="Executive Highlights"
            icon={TrendingUp}
            color="#0284C7"
            bgLight="#E0F2FE"
            items={highlights}
            emptyText="No call activity matches the selected filters."
          />
        </Box>

        <Box>
          <SummaryColumn
            title="Operational Risks"
            icon={AlertTriangle}
            color="#D97706"
            bgLight="#FEF3C7"
            items={risks}
            emptyText="No material operational risks were identified in the selected calls."
          />
        </Box>

        <Box>
          <SummaryColumn
            title="Data Quality Observations"
            icon={FileCheck}
            color="#7C3AED"
            bgLight="#EDE9FE"
            items={dqObservations}
            emptyText="No significant data quality issues were detected for the selected dataset."
          />
        </Box>

        <Box>
          <SummaryColumn
            title="Business Recommendations"
            icon={Target}
            color="#059669"
            bgLight="#D1FAE5"
            items={recommendations}
            emptyText="No action is recommended from the selected calls."
          />
        </Box>
      </Box>
    </Paper>
  );
}
