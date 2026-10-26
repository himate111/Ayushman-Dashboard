import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  X,
  PhoneCall,
  Clock,
  ShieldCheck,
  UserCheck,
  Headphones,
  Voicemail,
  Hourglass,
  Layers,
  HelpCircle,
  Hash,
  Calendar,
  Lock
} from 'lucide-react';
import InboundCallStatusBadge from './InboundCallStatusBadge';

export default function InboundCallDetailDrawer({
  open = false,
  call = null,
  loading = false,
  error = null,
  onClose
}) {
  if (!call && !loading) return null;

  const totalSec = call?.totalDurationSeconds || 0;
  const ringSec = call?.ringDurationSeconds || 0;
  const ivrSec = call?.ivrDurationSeconds || 0;
  const queueSec = call?.queueDurationSeconds || 0;
  const agentSec = call?.agentDurationSeconds || 0;
  const holdSec = call?.holdDurationSeconds || 0;

  // Percentage calculations for duration breakdown
  const calcPct = (sec) => {
    if (totalSec <= 0) return 0;
    return Math.min(100, Math.round((sec / totalSec) * 100));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          maxWidth: '100vw',
          bgcolor: '#F8FAFC',
          p: 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
              Call Detail Record #{call?.id || '...'}
            </Typography>
            {call && (
              <InboundCallStatusBadge callEnd={call.callEnd} isConnected={call.isConnected} />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Calendar size={13} />
            Arrival: {call?.formattedCallTime || call?.callTime || 'Loading...'}
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* Drawer Body */}
      <Box sx={{ p: 2.5, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={36} sx={{ color: '#235789', mb: 1.5 }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Loading call details...
            </Typography>
          </Box>
        ) : error ? (
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
            <Typography variant="subtitle2" sx={{ color: '#B91C1C', fontWeight: 700 }}>
              Error loading record
            </Typography>
            <Typography variant="body2" sx={{ color: '#7F1D1D', fontSize: '0.8rem', mt: 0.5 }}>
              {error}
            </Typography>
          </Paper>
        ) : call ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Section 1: Call Duration & Telephony Breakdown */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                  Call Duration Breakdown
                </Typography>
                <Chip
                  label={`Total: ${call.totalDuration || '00:00:00'}`}
                  size="small"
                  sx={{
                    bgcolor: '#EFF6FF',
                    color: '#1E40AF',
                    fontWeight: 700,
                    fontSize: '0.74rem'
                  }}
                />
              </Box>

              {/* Proportional Segment Bar */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    height: 10,
                    width: '100%',
                    bgcolor: '#F1F5F9',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    display: 'flex'
                  }}
                >
                  {ringSec > 0 && (
                    <Box
                      sx={{
                        width: `${calcPct(ringSec)}%`,
                        bgcolor: '#94A3B8'
                      }}
                      title={`Ring: ${call.ringDuration}`}
                    />
                  )}
                  {ivrSec > 0 && (
                    <Box
                      sx={{
                        width: `${calcPct(ivrSec)}%`,
                        bgcolor: '#818CF8'
                      }}
                      title={`IVR: ${call.ivrDuration}`}
                    />
                  )}
                  {queueSec > 0 && (
                    <Box
                      sx={{
                        width: `${calcPct(queueSec)}%`,
                        bgcolor: '#FBBF24'
                      }}
                      title={`Queue: ${call.queueDuration}`}
                    />
                  )}
                  {agentSec > 0 && (
                    <Box
                      sx={{
                        width: `${calcPct(agentSec)}%`,
                        bgcolor: '#34D399'
                      }}
                      title={`Agent: ${call.agentDuration}`}
                    />
                  )}
                  {holdSec > 0 && (
                    <Box
                      sx={{
                        width: `${calcPct(holdSec)}%`,
                        bgcolor: '#F87171'
                      }}
                      title={`Hold: ${call.holdDuration}`}
                    />
                  )}
                </Box>
              </Box>

              {/* Grid of Verified Durations */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={12} color="#94A3B8" /> Ring Duration
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                      {call.ringDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Voicemail size={12} color="#818CF8" /> IVR Menu Time
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                      {call.ivrDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Hourglass size={12} color="#D97706" /> Queue Wait
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#D97706', mt: 0.25 }}>
                      {call.queueDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Headphones size={12} color="#059669" /> Agent Talk Time
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', mt: 0.25 }}>
                      {call.agentDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={12} color="#64748B" /> Hold Duration
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                      {call.holdDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneCall size={12} color="#235789" /> Total Session
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#235789', mt: 0.25 }}>
                      {call.totalDuration || '00:00:00'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.67rem', display: 'block', mt: 1.25, fontStyle: 'italic' }}>
                Note: Durations represent recorded physical telephony metrics without synthetic event intervals.
              </Typography>
            </Paper>

            {/* Section 2: Caller & Routing Information */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', mb: 1.5 }}>
                Telephony & Routing
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ShieldCheck size={13} color="#059669" /> Caller Number (Masked)
                  </Typography>
                  <Tooltip title="PII masked on server prior to transmission" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#F1F5F9', px: 1, py: 0.25, borderRadius: '4px' }}>
                      <Lock size={12} color="#64748B" />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                        {call.maskedCallerNo || call.calledNo || '-'}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    DID Helpline Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.didNo || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    ACD Queue ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.acd || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Call Direction
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.callType || 'Incoming'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Skill Group
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.groupName || '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Section 3: Agent & Inquiry Reason Details */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', mb: 1.5 }}>
                Handling Agent & Inquiry Disposition
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Agent ID / Extension
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: call.agentId && call.agentId !== '-' ? '#0F172A' : '#94A3B8', fontSize: '0.8rem' }}>
                    {call.agentId || 'Unassigned / Not Connected'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Call Termination Entity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.callEnd || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Primary Disposition
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.disposition || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, pt: 0.25 }}>
                    Inquiry Reason (Sub-Disposition)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.8rem', textAlign: 'right', maxWidth: 220 }}>
                    {call.subDisposition || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Shift
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.shift || '-'}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Call Hour
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                    {call.callHour !== null && call.callHour !== undefined ? `Hour ${call.callHour}:00` : '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Section 4: Record Identity & Audit Integrity */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#F1F5F9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Hash size={14} color="#64748B" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem' }}>
                  AUDIT IDENTITY
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem', display: 'block' }}>
                Database Primary Key: <strong>{call.id}</strong> (Verified unique identifier on `dbo.inbound_calls`).
              </Typography>
            </Paper>

          </Box>
        ) : null}
      </Box>
    </Drawer>
  );
}
