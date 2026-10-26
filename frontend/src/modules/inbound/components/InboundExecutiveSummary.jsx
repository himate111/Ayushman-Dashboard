import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { 
  TrendingUp, 
  AlertTriangle, 
  FileSpreadsheet, 
  Lightbulb 
} from 'lucide-react';

function SummarySection({ title, items, icon: Icon, color, bgLight }) {
  if (!items || items.length === 0) return null;

  return (
    <Box
      sx={{
        p: '12px 14px',
        borderRadius: '8px',
        bgcolor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${color}`,
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '4px',
            bgcolor: bgLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {Icon && <Icon size={14} color={color} />}
        </Box>
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#1E293B',
            letterSpacing: '0.01em',
            textTransform: 'uppercase'
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box component="ul" sx={{ m: 0, pl: 2.2, color: '#334155' }}>
        {items.map((item, idx) => (
          <Typography
            component="li"
            key={idx}
            sx={{
              fontSize: '11.5px',
              lineHeight: 1.5,
              color: '#334155',
              mb: 0.5,
              '&:last-child': { mb: 0 }
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function InboundExecutiveSummary({ summary }) {
  if (!summary) return null;

  const hasAnyItems =
    (summary.executive && summary.executive.length > 0) ||
    (summary.issues && summary.issues.length > 0) ||
    (summary.dataQuality && summary.dataQuality.length > 0) ||
    (summary.recommendations && summary.recommendations.length > 0);

  if (!hasAnyItems) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: '14px',
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#0D3B66',
            letterSpacing: '-0.01em'
          }}
        >
          Executive Summary & Operational Intelligence
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
          Derived from live call metrics & automated telemetry
        </Typography>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6} lg={3}>
          <SummarySection
            title="Service Insights"
            items={summary.executive}
            icon={TrendingUp}
            color="#0D9488"
            bgLight="#CCFBF1"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <SummarySection
            title="Service Alerts"
            items={summary.issues}
            icon={AlertTriangle}
            color="#F59E0B"
            bgLight="#FEF3C7"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <SummarySection
            title="Data Quality"
            items={summary.dataQuality}
            icon={FileSpreadsheet}
            color="#6366F1"
            bgLight="#EEF2FF"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <SummarySection
            title="Recommendations"
            items={summary.recommendations}
            icon={Lightbulb}
            color="#2563EB"
            bgLight="#EFF6FF"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
