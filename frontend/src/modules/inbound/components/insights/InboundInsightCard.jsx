import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  PhoneOff,
  Clock,
  Layers,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Info,
  ExternalLink,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';

function getInboundSeverityChip(severity) {
  switch (severity) {
    case 'alert':
      return (
        <Chip
          icon={<AlertOctagon size={12} color="#DC2626" />}
          label="Critical SLA Alert"
          size="small"
          sx={{
            bgcolor: '#FEE2E2',
            color: '#991B1B',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
    case 'warning':
      return (
        <Chip
          icon={<AlertTriangle size={12} color="#D97706" />}
          label="High Attention"
          size="small"
          sx={{
            bgcolor: '#FEF3C7',
            color: '#92400E',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
    default:
      return (
        <Chip
          icon={<Info size={12} color="#0284C7" />}
          label="Audited Telemetry"
          size="small"
          sx={{
            bgcolor: '#E0F2FE',
            color: '#0369A1',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
  }
}

const ICON_MAP = {
  TrendingUp,
  PhoneOff,
  Clock,
  Layers,
  FileSpreadsheet,
  Users
};

export default function InboundInsightCard({ item, onNavigateToChart }) {
  if (!item) return null;

  const IconComponent = ICON_MAP[item.iconName] || TrendingUp;
  const borderAccentColor =
    item.severity === 'alert'
      ? '#EF4444'
      : item.severity === 'warning'
      ? '#F59E0B'
      : '#0284C7';

  const bgAccentTint =
    item.severity === 'alert'
      ? '#FEF2F2'
      : item.severity === 'warning'
      ? '#FFFBEB'
      : '#F0F9FF';

  return (
    <Card
      id={`insight-${item.id}`}
      sx={{
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: '#FFFFFF',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          borderColor: '#CBD5E1',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
        }
      }}
    >
      <CardContent sx={{ p: '18px !important' }}>
        {/* 1. Header Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: `${item.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
                flexShrink: 0
              }}
            >
              <IconComponent size={18} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                {item.sectionNumber}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: '#0D3B66',
                  lineHeight: 1.2
                }}
              >
                {item.title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getInboundSeverityChip(item.severity)}
            {onNavigateToChart && (
              <Button
                size="small"
                endIcon={<ExternalLink size={13} />}
                onClick={() => onNavigateToChart(item.chartKey)}
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

        {/* 2. Key Verified Finding */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: bgAccentTint,
            borderLeft: `4px solid ${borderAccentColor}`,
            borderRadius: '6px',
            mb: 2
          }}
        >
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: borderAccentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mb: 0.5
            }}
          >
            VERIFIED TELEMETRY FINDING
          </Typography>
          <Typography
            sx={{
              fontSize: '0.84rem',
              color: '#1E293B',
              lineHeight: 1.45,
              fontWeight: 500
            }}
          >
            {item.finding}
          </Typography>
        </Box>

        {/* 3. Quantitative Evidence Matrix */}
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            mb: 1
          }}
        >
          QUANTITATIVE TELEMETRY EVIDENCE
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
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
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  color: '#64748B',
                  lineHeight: 1.15,
                  mb: 0.3
                }}
              >
                {ev.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: ev.alert ? '#EF4444' : '#0D3B66'
                }}
              >
                {ev.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 4. Recommended Operational Action */}
        <Box
          sx={{
            p: 1.25,
            bgcolor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '6px',
            mb: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.35 }}>
            <CheckCircle2 size={13} color="#059669" />
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#047857',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              OPERATIONAL DIRECTIVE
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: '#065F46',
              lineHeight: 1.4,
              fontWeight: 500
            }}
          >
            {item.recommendation}
          </Typography>
        </Box>

        {/* 5. Methodological / Audit Footnote */}
        {item.limitation && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.75,
              pt: 1,
              borderTop: '1px solid #F1F5F9'
            }}
          >
            <Info size={13} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: '0.71rem',
                color: '#94A3B8',
                lineHeight: 1.35,
                fontStyle: 'italic'
              }}
            >
              {item.limitation}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
