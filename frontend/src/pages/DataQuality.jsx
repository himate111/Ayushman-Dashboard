import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Database, 
  FileCheck, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { getDataQuality } from '../api/analyticsApi';

export default function DataQuality({ onNavigateToExplorer }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuality = async () => {
      try {
        const data = await getDataQuality();
        setStats(data);
      } catch (err) {
        console.error('Failed to load data quality:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuality();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D3B66', mb: 0.5 }}>
          Data Quality & Governance Audit
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Real-time health assessment of beneficiary grievance records, completeness scoring, and field integrity validation in MSSQL.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : stats ? (
        <Grid container spacing={3}>
          {/* Completeness Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <ShieldCheck size={28} color="#0284C7" />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0369A1' }}>
                    Data Completeness Score
                  </Typography>
                </Box>

                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0369A1', mb: 1 }}>
                  {stats.dataCompletenessRate}%
                </Typography>

                <LinearProgress 
                  variant="determinate" 
                  value={stats.dataCompletenessRate} 
                  sx={{ height: 10, borderRadius: 5, mb: 2, bgcolor: '#BAE6FD' }} 
                />

                <Typography variant="body2" sx={{ color: '#0C4A6E', fontSize: '0.82rem' }}>
                  Evaluates mandatory reporting fields (District, Category, SubCategory, Assigned Officer) across {stats.totalRecords?.toLocaleString()} records.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Integrity Observations */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66', mb: 2 }}>
                Critical Field Integrity Metrics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>
                      Closed Records with Missing ResolutionDate
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#B45309' }}>
                      {stats.missingResolutionDateOnClosed?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 0.5 }}>
                      Identified in raw report: ~98% of closed cases lack explicit closure timestamps. The system avoids fabricated dates and accurately monitors pending backlog.
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                      Status History Transitions Tracked
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857' }}>
                      {stats.totalStatusTransitionsTracked?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#064E3B', display: 'block', mt: 0.5 }}>
                      Audit log records preserving status evolutions (e.g. WIP to Closed) across multi-month overlapping imports.
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Missing Districts</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66' }}>
                      {stats.missingDistrictCount}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Tooltip title={stats.missingOfficerCount > 0 ? "Click to inspect the unassigned cases in Grievance Explorer" : "No missing officers"} arrow>
                    <Box 
                      id="missing-officers-card"
                      data-testid="missing-officers-card"
                      onClick={() => {
                        if (stats.missingOfficerCount > 0 && onNavigateToExplorer) {
                          onNavigateToExplorer({ officer: 'Unassigned' });
                        }
                      }}
                      sx={{ 
                        p: 1.5, 
                        bgcolor: stats.missingOfficerCount > 0 ? '#FEF2F2' : '#F8FAFC', 
                        borderRadius: '8px', 
                        border: stats.missingOfficerCount > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        cursor: stats.missingOfficerCount > 0 ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        '&:hover': stats.missingOfficerCount > 0 ? {
                          bgcolor: '#FEE2E2',
                          borderColor: '#EF4444',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)'
                        } : {}
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: stats.missingOfficerCount > 0 ? '#991B1B' : '#64748B', fontWeight: 600 }}>
                          Missing Officers
                        </Typography>
                        {stats.missingOfficerCount > 0 && (
                          <Chip 
                            label="Inspect" 
                            size="small" 
                            color="error" 
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }} 
                          />
                        )}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: stats.missingOfficerCount > 0 ? '#DC2626' : '#0D3B66', mt: 0.5 }}>
                        {stats.missingOfficerCount}
                      </Typography>
                      {stats.missingOfficerCount > 0 && (
                        <Typography variant="caption" sx={{ color: '#B91C1C', fontSize: '0.68rem', display: 'block', mt: 0.3 }}>
                          Click to filter Explorer →
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Duplicate CompIds Blocked</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                      100% Guarded
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Governance Principles */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0D3B66', mb: 1.5 }}>
                Beneficiary Grievance Governance Rules
              </Typography>
              <List sx={{ pt: 0 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle2 size={18} color="#10B981" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Immutable Primary Business Identifier"
                    secondary="The CompId from the Ministry's call center feed is enforced with a database UNIQUE constraint, ensuring no complaint can ever be duplicated across overlapping monthly reports."
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle2 size={18} color="#10B981" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No False Data Synthesis"
                    secondary="When resolution dates are absent from source feeds, the intelligence platform presents active registrations and pending queues rather than inventing artificial closure dates."
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle2 size={18} color="#10B981" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Audit Continuity"
                    secondary="When newer files report a change in complaint status (WIP -> Closed) or reassignment of grievance officer, the previous state is archived in GrievanceStatusHistory before updating current state."
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
