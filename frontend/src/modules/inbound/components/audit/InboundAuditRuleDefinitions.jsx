import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import { ChevronDown, BookOpen, ShieldCheck, AlertTriangle, Info, CheckCircle2, Terminal } from 'lucide-react';

const DEFAULT_RULES = [
  {
    ruleId: 'R1',
    name: 'Missing Outcome (Disposition) on Handled Calls',
    category: 'Confirmed Completeness Issues',
    fieldsEvaluated: 'call_end, disposition',
    conditionSql: "call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) = '')",
    severity: 'critical',
    classification: 'Confirmed Completeness Issue',
    businessInterpretation: 'The caller connected with a human agent, but the call center agent disconnected without recording the primary call outcome in the telephony CRM.',
    remediation: 'Configure telephony ACD/CRM to require mandatory disposition entry before the agent line returns to idle status.'
  },
  {
    ruleId: 'R2',
    name: 'Missing Inquiry Reason (Sub-Disposition) on Handled Calls',
    category: 'Confirmed Completeness Issues',
    fieldsEvaluated: 'call_end, sub_disposition',
    conditionSql: "call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) = '')",
    severity: 'critical',
    classification: 'Confirmed Completeness Issue',
    businessInterpretation: 'The call was handled by an agent, but granular beneficiary reason details (e.g. Hospital Query, e-Card Status) were left blank.',
    remediation: 'Implement contextual second-level dropdown menus tied to the primary disposition category in agent software.'
  },
  {
    ruleId: 'R3',
    name: 'Unexpected Missing Agent Name on Handled Calls',
    category: 'Confirmed Completeness Issues',
    fieldsEvaluated: 'call_end, agent_name',
    conditionSql: "call_end = 'Agent' AND (agent_name IS NULL OR LTRIM(RTRIM(agent_name)) = '')",
    severity: 'critical',
    classification: 'Confirmed Completeness Issue',
    businessInterpretation: 'The call was classified as ended by agent, but no agent SIP identifier or username was logged in the telephony database (198 records).',
    remediation: 'Verify PBX SIP extension registration logging and ensure SIP credentials map automatically to agent user records.'
  },
  {
    ruleId: 'R4',
    name: 'Short Agent Talk Time (< 3 Seconds)',
    category: 'Review-Required Anomalies',
    fieldsEvaluated: 'call_end, talk_time',
    conditionSql: "call_end = 'Agent' AND talk_time < 3",
    severity: 'warning',
    classification: 'Review-Required Anomaly',
    businessInterpretation: 'Agent bridge was established, but the conversation lasted under 3 seconds. Common causes include accidental hang-ups, dead-air transfers, or caller drop immediately after greeting.',
    remediation: 'Review ACD line transfer logs and audit agent auto-answer headsets for connection stability.'
  },
  {
    ruleId: 'R5',
    name: 'Queue Termination Point with Recorded Talk Duration (>= 3 Seconds)',
    category: 'Review-Required Anomalies',
    fieldsEvaluated: 'call_end, talk_time',
    conditionSql: "call_end IN ('Queue', 'IVR') AND talk_time >= 3",
    severity: 'warning',
    classification: 'Review-Required Anomaly',
    businessInterpretation: 'The PBX marked the termination entity as Queue/IVR, but talk duration exceeds 3 seconds. Indicates the caller began speaking before dropping, or an ACD state event sequencing lag.',
    remediation: 'Audit PBX event sequencing timers to ensure call state transition flags update synchronously with media stream closure.'
  },
  {
    ruleId: 'O1',
    name: 'Unassigned Queue Drop (Expected Operational Condition)',
    category: 'Expected Operational Conditions',
    fieldsEvaluated: 'call_end, agent_name',
    conditionSql: "call_end = 'Queue' AND (agent_name IS NULL OR LTRIM(RTRIM(agent_name)) = '')",
    severity: 'info',
    classification: 'Expected Operational Condition',
    businessInterpretation: 'Caller hung up while waiting in the ACD queue prior to being assigned or connected to a call agent. This is normal telephony abandonment behavior and NOT a data defect (10,577 records).',
    remediation: 'No data defect remediation required. Address operationally through workforce capacity planning and queue SLA management.'
  }
];

export default function InboundAuditRuleDefinitions({ rules = [] }) {
  const displayRules = rules.length > 0 ? rules : DEFAULT_RULES;
  const [expanded, setExpanded] = useState('R1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getSeverityChip = (severity) => {
    if (severity === 'critical') {
      return (
        <Chip
          label="Critical Defect"
          size="small"
          sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #FECACA', height: 20 }}
        />
      );
    }
    if (severity === 'warning' || severity === 'review') {
      return (
        <Chip
          label="Review Required"
          size="small"
          sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #FDE68A', height: 20 }}
        />
      );
    }
    return (
      <Chip
        label="Operational Condition"
        size="small"
        sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #A7F3D0', height: 20 }}
      />
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #E2E8F0'
            }}
          >
            <BookOpen size={18} color="#0D3B66" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 800, color: '#0D3B66' }}>
              Telephony Data Quality Governance Rules & Logic
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
              Catalog of verified validation rules, mathematical conditions, and operational remediation standards
            </Typography>
          </Box>
        </Box>

        <Chip
          label="6 Telephony Governance Standards"
          size="small"
          sx={{ bgcolor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #E2E8F0' }}
        />
      </Box>

      {/* Accordion Rules Catalog */}
      <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        {displayRules.map((rule) => {
          const ruleId = rule.ruleId || rule.RuleId;
          const name = rule.name || rule.Name;
          const category = rule.category || rule.Category;
          const fields = rule.fieldsEvaluated || rule.FieldsEvaluated;
          const condition = rule.conditionSql || rule.ConditionSql;
          const severity = (rule.severity || rule.Severity || 'info').toLowerCase();
          const interpretation = rule.businessInterpretation || rule.BusinessInterpretation;
          const remediation = rule.remediation || 'Enforce telephony CRM validation rules prior to call wrap-up.';

          return (
            <Accordion
              key={ruleId}
              expanded={expanded === ruleId}
              onChange={handleChange(ruleId)}
              elevation={0}
              disableGutters
              sx={{
                borderBottom: '1px solid #F1F5F9',
                '&:last-child': { borderBottom: 'none' },
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary
                expandIcon={<ChevronDown size={18} color="#64748B" />}
                sx={{
                  bgcolor: expanded === ruleId ? '#F8FAFC' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  minHeight: 48,
                  '&.Mui-expanded': { minHeight: 48 }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: '100%', pr: 1 }}>
                  <Chip
                    label={ruleId}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      fontFamily: 'monospace',
                      bgcolor: ruleId.startsWith('R') ? '#FEF2F2' : '#EFF6FF',
                      color: ruleId.startsWith('R') ? '#DC2626' : '#2563EB',
                      border: '1px solid',
                      borderColor: ruleId.startsWith('R') ? '#FECACA' : '#DBEAFE',
                      height: 22
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0D3B66', flex: 1, minWidth: 200 }}>
                    {name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSeverityChip(severity)}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2.5, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
                <Grid container spacing={2}>
                  {/* SQL Condition */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        <Terminal size={14} color="#0D3B66" />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0D3B66', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                          Validation Condition (MSSQL Dialect)
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '4px',
                          bgcolor: '#1E293B',
                          color: '#38BDF8',
                          fontFamily: 'monospace',
                          fontSize: '0.73rem',
                          overflowX: 'auto',
                          lineHeight: 1.4,
                          mb: 1
                        }}
                      >
                        {condition}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        <strong>Fields Evaluated:</strong> <code>{fields}</code>
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Business Interpretation & Remediation */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0D3B66', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 0.5 }}>
                        Operational Impact & Interpretation
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.45, mb: 1.5 }}>
                        {interpretation}
                      </Typography>

                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 0.5 }}>
                        Recommended Operational Remediation
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: '#065F46', lineHeight: 1.45 }}>
                        {remediation}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
}
