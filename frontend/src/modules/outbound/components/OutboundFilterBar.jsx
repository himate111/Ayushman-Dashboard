import React from 'react';
import { Box, Paper, Button } from '@mui/material';
import { RotateCcw } from 'lucide-react';
import FilterMultiSelect from '../../../components/FilterMultiSelect';

export default function OutboundFilterBar({
  filters,
  options,
  onChange,
  onReset
}) {
  const yearOptions = (options?.years || []).map((y) => ({
    value: String(y),
    label: String(y)
  }));

  const monthOptions = (options?.months || []).map((m) => ({
    value: String(m),
    label: String(m)
  }));

  const groupOptions = (options?.groupNames || []).map((g) => ({
    value: String(g),
    label: String(g)
  }));

  const dispositionOptions = (options?.dispositions || []).map((d) => ({
    value: String(d),
    label: String(d)
  }));

  const subDispositionOptions = (options?.subDispositions || []).map((s) => ({
    value: String(s),
    label: String(s)
  }));

  const shiftOptions = (options?.shifts || ['Morning Shift', 'Evening Shift', 'Night Shift']).map((s) => ({
    value: String(s),
    label: String(s)
  }));

  const agentOptions = (options?.agents || []).map((a) => ({
    value: String(a),
    label: String(a)
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
            xl: 'repeat(8, 1fr)'
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
          minWidth={160}
        />

        {/* 2. Month */}
        <FilterMultiSelect
          label="Month"
          pluralLabel="Months"
          options={monthOptions}
          value={filters.month || []}
          onChange={(val) => onChange('month', val)}
          minWidth={160}
        />

        {/* 3. Group / Campaign */}
        <FilterMultiSelect
          label="Campaign / Group"
          pluralLabel="Groups"
          options={groupOptions}
          value={filters.groupName || []}
          onChange={(val) => onChange('groupName', val)}
          minWidth={180}
        />

        {/* 4. Disposition */}
        <FilterMultiSelect
          label="Disposition"
          pluralLabel="Dispositions"
          options={dispositionOptions}
          value={filters.disposition || []}
          onChange={(val) => onChange('disposition', val)}
          minWidth={170}
        />

        {/* 5. Sub-Disposition */}
        <FilterMultiSelect
          label="Sub-Disposition"
          pluralLabel="Sub-Dispositions"
          options={subDispositionOptions}
          value={filters.subDisposition || []}
          onChange={(val) => onChange('subDisposition', val)}
          minWidth={180}
        />

        {/* 6. Shift */}
        <FilterMultiSelect
          label="Shift"
          pluralLabel="Shifts"
          options={shiftOptions}
          value={filters.shift || []}
          onChange={(val) => onChange('shift', val)}
          minWidth={160}
        />

        {/* 7. Agent */}
        <FilterMultiSelect
          label="Agent"
          pluralLabel="Agents"
          options={agentOptions}
          value={filters.agent || []}
          onChange={(val) => onChange('agent', val)}
          minWidth={160}
        />

        {/* 8. Reset Action */}
        <Button
          variant="outlined"
          size="small"
          onClick={onReset}
          startIcon={<RotateCcw size={14} />}
          sx={{
            height: 38,
            color: '#64748B',
            borderColor: '#CBD5E1',
            borderRadius: '6px',
            fontSize: '12px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#94A3B8',
              bgcolor: '#F8FAFC',
              color: '#334155'
            }
          }}
        >
          Reset Filters
        </Button>
      </Box>
    </Paper>
  );
}
