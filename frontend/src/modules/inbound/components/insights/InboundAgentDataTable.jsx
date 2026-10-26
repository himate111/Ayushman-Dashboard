import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import { Search, Users, Clock } from 'lucide-react';

export default function InboundAgentDataTable({ agentAnalytics }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const topAgents = useMemo(() => agentAnalytics?.topAgents || [], [agentAnalytics?.topAgents]);
  const bottomAgents = useMemo(() => agentAnalytics?.bottomAgents || [], [agentAnalytics?.bottomAgents]);

  // Filter out any invalid items and ensure unique list for "All"
  const allAgents = useMemo(() => {
    const map = new Map();
    [...topAgents, ...bottomAgents].forEach((a) => {
      if (a && a.agent) {
        map.set(a.agent, a);
      }
    });
    return Array.from(map.values());
  }, [topAgents, bottomAgents]);

  const displayedList = useMemo(() => {
    let list = [];
    if (tabIndex === 0) {
      list = topAgents;
    } else if (tabIndex === 1) {
      list = bottomAgents;
    } else {
      list = allAgents;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((a) => (a.agent || '').toLowerCase().includes(query));
  }, [tabIndex, topAgents, bottomAgents, allAgents, searchQuery]);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: { xs: 2, sm: 2.5 },
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      {/* Table Header and Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 2
        }}
      >
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
              color: '#059669'
            }}
          >
            <Users size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0D3B66' }}>
              Agent Telephony Audit & Performance Register
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#64748B' }}>
              Granular call completion rates, conversation duration, and operator workload distribution
            </Typography>
          </Box>
        </Box>

        {/* Controls: Search and Tabs */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            gap: 1.5
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                minHeight: 32,
                py: 0.5,
                px: 1.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '6px'
              },
              '& .Mui-selected': {
                color: '#0D3B66 !important',
                bgcolor: '#F1F5F9'
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Top Volume (10)" />
            <Tab label="Low Activity (10)" />
            <Tab label="Combined Telephony Audit" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search Agent ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} color="#94A3B8" />
                  </InputAdornment>
                ),
                sx: {
                  height: 32,
                  fontSize: '0.78rem',
                  width: { xs: '100%', sm: 180 },
                  bgcolor: '#F8FAFC',
                  borderRadius: '6px'
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Agent Table */}
      <TableContainer
        sx={{
          maxHeight: 440,
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          '&::-webkit-scrollbar': { height: 6, width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 }
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1 }}>
                #
              </TableCell>
              <TableCell sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1 }}>
                AGENT / EXTENSION
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1 }}>
                TOTAL INTAKE
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1 }}>
                CONNECTED
              </TableCell>
              <TableCell sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1, minWidth: 160 }}>
                COMPLETION RATE
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', fontSize: '0.72rem', py: 1 }}>
                AVG TALK DURATION
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8', fontSize: '0.82rem' }}>
                  No agent telemetry found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            ) : (
              displayedList.map((agent, idx) => {
                const isUnassigned = agent.agent === '-' || agent.name === '-';
                const displayName = isUnassigned ? 'Unassigned / Queue Drop' : agent.agent || agent.name;
                const connectionRate = Number(agent.connectionRate) || 0;
                const rateColor =
                  connectionRate >= 98
                    ? '#059669'
                    : connectionRate >= 90
                    ? '#0284C7'
                    : connectionRate >= 50
                    ? '#D97706'
                    : '#DC2626';

                return (
                  <TableRow
                    key={agent.agent || idx}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#F8FAFC' },
                      bgcolor: isUnassigned ? '#FEF2F2' : 'inherit'
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '4px',
                            bgcolor: isUnassigned ? '#FEE2E2' : '#F1F5F9',
                            color: isUnassigned ? '#DC2626' : '#0D3B66',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}
                        >
                          {isUnassigned ? '!' : (agent.agent?.[0] || 'A')}
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: isUnassigned ? '#DC2626' : '#0F172A'
                            }}
                          >
                            {displayName}
                          </Typography>
                          {isUnassigned && (
                            <Typography sx={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600 }}>
                              Trunk routing overflow
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      {Number(agent.totalCalls || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      {Number(agent.connectedCalls || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(connectionRate, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#E2E8F0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: rateColor,
                                borderRadius: 3
                              }
                            }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: rateColor,
                            minWidth: 42,
                            textAlign: 'right'
                          }}
                        >
                          {connectionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={12} color="#94A3B8" />
                        <span>{agent.avgAgentDuration || '0s'}</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
