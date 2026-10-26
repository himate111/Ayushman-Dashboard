import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { PhoneCall, Clock, Voicemail, AlertCircle, PhoneOff } from 'lucide-react';

export default function InboundCallStatusBadge({ callEnd, isConnected, size = 'small' }) {
  const normalized = (callEnd || '').trim();

  // 1. Connected Calls (agent_duration >= 3s)
  if (isConnected) {
    if (normalized === 'Queue') {
      return (
        <Tooltip title="Talk duration ≥ 3s (PBX switch logged Queue termination - Telephony Anomaly)" arrow>
          <Chip
            icon={<PhoneCall size={12} color="#059669" />}
            label="Connected (Queue ≥3s)"
            size={size}
            sx={{
              bgcolor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #10B981',
              fontWeight: 700,
              fontSize: '0.72rem',
              height: size === 'small' ? 22 : 26
            }}
          />
        </Tooltip>
      );
    }

    if (normalized === 'IVR') {
      return (
        <Tooltip title="Talk duration ≥ 3s (IVR Disconnect)" arrow>
          <Chip
            icon={<PhoneCall size={12} color="#059669" />}
            label="Connected (IVR ≥3s)"
            size={size}
            sx={{
              bgcolor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #10B981',
              fontWeight: 700,
              fontSize: '0.72rem',
              height: size === 'small' ? 22 : 26
            }}
          />
        </Tooltip>
      );
    }

    return (
      <Chip
        icon={<PhoneCall size={12} color="#059669" />}
        label="Connected (Agent)"
        size={size}
        sx={{
          bgcolor: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          fontWeight: 700,
          fontSize: '0.72rem',
          height: size === 'small' ? 22 : 26
        }}
      />
    );
  }

  // 2. Early Ended / Not Connected Calls (agent_duration < 3s)
  if (normalized === 'Agent') {
    return (
      <Tooltip title="Talk duration < 3s (Early Ended / Accidental Disconnect)" arrow>
        <Chip
          icon={<Clock size={12} color="#D97706" />}
          label="Early Ended (<3s)"
          size={size}
          sx={{
            bgcolor: '#FFFBEB',
            color: '#92400E',
            border: '1px solid #FDE68A',
            fontWeight: 700,
            fontSize: '0.72rem',
            height: size === 'small' ? 22 : 26
          }}
        />
      </Tooltip>
    );
  }

  if (normalized === 'Queue') {
    return (
      <Chip
        icon={<PhoneOff size={12} color="#DC2626" />}
        label="Abandoned (Queue)"
        size={size}
        sx={{
          bgcolor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          fontWeight: 700,
          fontSize: '0.72rem',
          height: size === 'small' ? 22 : 26
        }}
      />
    );
  }

  if (normalized === 'IVR') {
    return (
      <Chip
        icon={<Voicemail size={12} color="#4F46E5" />}
        label="Abandoned (IVR)"
        size={size}
        sx={{
          bgcolor: '#EEF2FF',
          color: '#3730A3',
          border: '1px solid #C7D2FE',
          fontWeight: 700,
          fontSize: '0.72rem',
          height: size === 'small' ? 22 : 26
        }}
      />
    );
  }

  return (
    <Chip
      icon={<AlertCircle size={12} color="#64748B" />}
      label={callEnd || 'Unknown'}
      size={size}
      sx={{
        bgcolor: '#F1F5F9',
        color: '#475569',
        border: '1px solid #E2E8F0',
        fontWeight: 600,
        fontSize: '0.72rem',
        height: size === 'small' ? 22 : 26
      }}
    />
  );
}
