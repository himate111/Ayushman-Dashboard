import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { Database, Shield, Server, Users, Key, HardDrive, PhoneCall, CheckCircle2 } from 'lucide-react';
import { getUsers } from '../api/authApi';

export default function SettingsPage({ currentUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const u = await getUsers();
        setUsers(u);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D3B66', mb: 0.5 }}>
          System Configuration & Governance
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Database architecture, active connection parameters, and role-based access controls for the PM-JAY Intelligence Suite.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 1. Beneficiary Grievance Database Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Database size={24} color="#008080" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '1rem' }}>
                  Grievance Database Profile
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Beneficiary Complaints & Risk Surveillance
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Server Host / Instance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>localhost (MSSQLSERVER)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Target Database</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#008080', textAlign: 'right' }}>BeneficiaryGrievanceDB</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Primary Source Table</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>dbo.Grievances (5,154 records)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Audit History Tables</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>dbo.GrievanceStatusHistory, dbo.GrievanceImports</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Authentication Mode</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>Windows Integrated Security</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Connection Status</Typography>
                <Chip label="Connected & Operational" size="small" color="success" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Storage Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>D:\Grievience\database</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 2. Inbound Call Analytics Database Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <PhoneCall size={24} color="#235789" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '1rem' }}>
                  Telephony Analytics Database Profile
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Call Detail Records & Telephony Operations
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Server Host / Instance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>localhost (MSSQLSERVER)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Target Database</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#235789', textAlign: 'right' }}>call_center</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Primary Source Table</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>dbo.inbound_calls (396,425 records)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Telephony Attributes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>PBX Call-End, Agent Talk, Queue Wait, Audio</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Authentication Mode</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>Windows Integrated Security</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, borderBottom: '1px solid #F1F5F9', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Connection Status</Typography>
                <Chip label="Connected & Operational" size="small" color="success" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.7, gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>Module Scope</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>Inbound Call Redressal & Quality Audit</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 3. Tech Stack Specs */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Server size={24} color="#0D3B66" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66' }}>
                Technology & Runtime Specifications
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>Backend API</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>ASP.NET Core .NET 8</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>v8.0.426 Web API</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>ORM & Data Access</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>Entity Framework 8</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>EF Core 8.0.12</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>Frontend UI</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>React 19 + Vite</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Material UI v6</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>Analytics Engine</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>Apache ECharts</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Enterprise Visualisation</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>Spreadsheet Engine</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>ClosedXML & CsvHelper</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Excel / CSV Parser</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* User Management List */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Users size={24} color="#0D3B66" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66' }}>
                Authorized System Operators
              </Typography>
            </Box>

            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Designation / Full Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
