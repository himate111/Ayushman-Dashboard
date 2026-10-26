import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { RefreshCw, Shield, Database, User } from 'lucide-react';

export default function Navbar({ onRefresh, isRefreshing, user }) {
  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#0D3B66', borderBottom: '1px solid #1E568A', zIndex: 1201 }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '8px', 
            bgcolor: 'rgba(255,255,255,0.12)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Shield size={24} color="#00E5FF" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, lineHeight: 1.2, fontSize: '1.15rem' }}>
              आयुष्मान संपर्क — Beneficiary Grievance Intelligence
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
              National Health Authority • Beneficiary Redressal & Backlog Monitoring
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<Database size={14} color="#10B981" />}
            label="MSSQL: BeneficiaryGrievanceDB"
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />

          <Chip
            icon={<User size={14} color="#CBD5E1" />}
            label={user?.username ? `${user.username} (${user.role})` : 'Administrator'}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem',
            }}
          />

          <Tooltip title="Refresh Dashboard Data">
            <IconButton
              onClick={onRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
