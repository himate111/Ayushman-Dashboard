import React from 'react';
import { Box, Paper, Button, TextField, Typography } from '@mui/material';
import { RotateCcw } from 'lucide-react';
import FilterMultiSelect from '../../../components/FilterMultiSelect';
import { MONTH_NAMES } from '../utils/inboundFormatters';

export default function InboundFilterBar({
  filters,
  options,
  onChange,
  onReset
}) {
  const monthOptions = (options?.months || []).map((m) => ({
    value: String(m),
    label: MONTH_NAMES[m] || String(m)
  }));

  const yearOptions = (options?.years || []).map((y) => ({
    value: String(y),
    label: String(y)
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: '10px 14px',
        mb: '14px',
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
            xl: 'repeat(10, 1fr)'
          },
          gap: '10px',
          alignItems: 'end'
        }}
      >
        {/* 1. Year */}
        <FilterMultiSelect
          label="Year"
          pluralLabel="Years"
          options={yearOptions}
          value={filters.year || []}
          onChange={(val) => onChange('year', val)}
          minWidth={180}
        />

        {/* 2. Month */}
        <FilterMultiSelect
          label="Month"
          pluralLabel="Months"
          options={monthOptions}
          value={filters.month || []}
          onChange={(val) => onChange('month', val)}
          minWidth={200}
        />

        {/* 3. Start Date */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              mb: 0.5,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            Start Date
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
            slotProps={{
              input: {
                sx: {
                  height: '38px',
                  fontSize: '12.5px',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF'
                }
              }
            }}
          />
        </Box>

        {/* 4. End Date */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              mb: 0.5,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            End Date
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange('endDate', e.target.value)}
            slotProps={{
              input: {
                sx: {
                  height: '38px',
                  fontSize: '12.5px',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF'
                }
              }
            }}
          />
        </Box>

        {/* 5. Group Name */}
        <FilterMultiSelect
          label="Group Name"
          pluralLabel="Groups"
          options={options?.groups || []}
          value={filters.groupName || []}
          onChange={(val) => onChange('groupName', val)}
          minWidth={260}
          placement="bottom-end"
        />

        {/* 6. Agent */}
        <FilterMultiSelect
          label="Agent"
          pluralLabel="Agents"
          options={options?.agents || []}
          value={filters.agent || []}
          onChange={(val) => onChange('agent', val)}
          minWidth={220}
        />

        {/* 7. Disposition */}
        <FilterMultiSelect
          label="Disposition"
          pluralLabel="Dispositions"
          options={options?.dispositions || []}
          value={filters.disposition || []}
          onChange={(val) => onChange('disposition', val)}
          minWidth={220}
        />

        {/* 8. Sub Disposition */}
        <FilterMultiSelect
          label="Sub-Disposition"
          pluralLabel="Sub-Dispositions"
          options={options?.subDispositions || []}
          value={filters.subDisposition || []}
          onChange={(val) => onChange('subDisposition', val)}
          minWidth={280}
          placement="bottom-end"
        />

        {/* 9. Shift */}
        <FilterMultiSelect
          label="Shift"
          pluralLabel="Shifts"
          options={options?.shifts || []}
          value={filters.shift || []}
          onChange={(val) => onChange('shift', val)}
          minWidth={180}
          placement="bottom-end"
        />

        {/* 10. Reset Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'transparent',
              mb: 0.5,
              lineHeight: 1,
              userSelect: 'none'
            }}
          >
            Reset
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={onReset}
            startIcon={<RotateCcw size={14} />}
            sx={{
              height: '38px',
              fontSize: '12.5px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: '#0D3B66',
                color: '#0D3B66',
                bgcolor: '#F1F5F9'
              }
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
