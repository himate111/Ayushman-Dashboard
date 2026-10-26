import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export default function InboundAuditHeader({ loading = false, onRefresh }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              bgcolor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #A7F3D0'
            }}
          >
            <CheckCircle2 size={20} color="#059669" />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#0D3B66',
              fontSize: { xs: '18px', sm: '22px', md: '28px', lg: '30px' },
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              minWidth: 0
            }}
          >
            Inbound Data Quality & Audit
          </Typography>
        </Box>

        <Tooltip title="Refresh Telephony Audit" placement="top">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            size="small"
            aria-label="Refresh Telephony Audit"
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
        Call Record Integrity, Field Completeness, and Operational Data Validation
      </Typography>
    </Box>
  );
}
