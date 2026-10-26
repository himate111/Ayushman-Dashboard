import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Grid, 
  Divider, 
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { getGrievanceById, getGrievanceByCompId } from '../api/grievanceApi';
import { User, Phone, MapPin, Building, AlertTriangle, Clock, History } from 'lucide-react';

export default function GrievanceDetailModal({ open, onClose, grievanceId, compId }) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!open) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        let res;
        if (grievanceId) {
          res = await getGrievanceById(grievanceId);
        } else if (compId) {
          res = await getGrievanceByCompId(compId);
        }
        setDetail(res);
      } catch (err) {
        console.error('Failed to load grievance details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [open, grievanceId, compId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0D3B66', color: '#FFFFFF', py: 2, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Grievance Record #{detail?.compId || compId || grievanceId}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Registered on {detail?.compDate} • Scheme: {detail?.complaintFor || 'PMJAY'}
            </Typography>
          </Box>
          {detail && (
            <Chip 
              label={detail.status} 
              sx={{ 
                bgcolor: detail.status === 'Closed' ? '#10B981' : '#F59E0B', 
                color: '#FFFFFF', 
                fontWeight: 700,
                fontSize: '0.8rem'
              }} 
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : detail ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* High-Risk Banner if flagged */}
            {detail.isRiskFlagged && (
              <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', display: 'flex', gap: 1 }}>
                <AlertTriangle size={20} color="#DC2626" />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#B91C1C', fontWeight: 700 }}>
                    High-Risk Case: {detail.riskCategory}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7F1D1D' }}>
                    {detail.riskReason}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Beneficiary Details */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D3B66', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={16} /> Beneficiary Profile (Confidential & Masked)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Citizen Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.citizenName}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Mobile No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.maskedMobile}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Aadhaar No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.maskedAadhar}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>District / State</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.beneficiaryDistrict}, {detail.beneficiaryState}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>PMJAY ID / Case No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.pmjayId || detail.caseNo || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Gender / DOB</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.citizenGender || 'N/A'} • {detail.citizenDOB || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Grievance Classification */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D3B66', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building size={16} /> Grievance Classification & Hospital
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Category</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.grievanceCategory}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Sub-Category / Reason</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.grievanceType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Hospital Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.hospitalName || 'Not Applicable / State Level'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Assigned Officer</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail.officerName} ({detail.officerLevel})</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Description / Citizen Remarks</Typography>
                  <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '6px', mt: 0.5, whiteSpace: 'pre-line' }}>
                    {detail.compRemarks || 'No remarks recorded.'}
                  </Typography>
                </Grid>
                {detail.cSolution && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>Resolution / Citizen Solution</Typography>
                    <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', mt: 0.5 }}>
                      {detail.cSolution}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Status Transition History */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D3B66', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History size={16} /> Audit & Status Transition History
              </Typography>
              {detail.statusHistory && detail.statusHistory.length > 0 ? (
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Changed Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Previous Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>New Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Assigned Officer</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.statusHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{new Date(h.changedAt).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{h.previousStatus || 'N/A'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{h.newStatus}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{h.newOfficer || h.previousOfficer || 'Unchanged'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{h.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  No historical status changes recorded yet for this grievance.
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 4 }}>
            Grievance not found.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#0D3B66' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
