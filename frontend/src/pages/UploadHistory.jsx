import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Chip, 
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { History, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { getImportHistory, getBatchErrors } from '../api/importApi';

export default function UploadHistory() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorDialog, setErrorDialog] = useState(null);
  const [batchErrors, setBatchErrors] = useState([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getImportHistory();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenErrors = async (batchId) => {
    setErrorDialog(batchId);
    setLoadingErrors(true);
    try {
      const errs = await getBatchErrors(batchId);
      setBatchErrors(errs);
    } catch (e) {
      console.error('Failed to load batch errors:', e);
    } finally {
      setLoadingErrors(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D3B66', mb: 0.5 }}>
            Upload History & Audit Trail
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Complete historical log of all grievance imports, duplicate skipping records, and execution metrics in MSSQL.
          </Typography>
        </Box>

        <IconButton onClick={fetchHistory} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={18} />
        </IconButton>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : batches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <History size={48} color="#94A3B8" />
            <Typography variant="h6" sx={{ color: '#64748B', mt: 1 }}>
              No upload history recorded yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Batch #</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>File Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Import Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Total Rows</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>New Added</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Unchanged</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Errors</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#0D3B66' }}>
                      #{b.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
                      {b.fileName}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>
                      {new Date(b.importDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={b.importStatus}
                        size="small"
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          bgcolor: b.importStatus === 'Completed' ? '#DCFCE7' : '#FEE2E2',
                          color: b.importStatus === 'Completed' ? '#166534' : '#991B1B',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                      {b.totalRecords?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#059669' }}>
                      +{b.newRecordsCount?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706' }}>
                      {b.updatedRecordsCount?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {b.unchangedRecordsCount?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>
                      {(b.executionTimeMs / 1000).toFixed(1)}s
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>
                      {b.importedBy}
                    </TableCell>
                    <TableCell>
                      {b.errorRecordsCount > 0 ? (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleOpenErrors(b.id)}
                          sx={{ fontSize: '0.7rem', py: 0.2 }}
                        >
                          {b.errorRecordsCount} Errors
                        </Button>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                          0
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Batch Errors Modal */}
      <Dialog open={!!errorDialog} onClose={() => setErrorDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#B91C1C', color: '#FFFFFF' }}>
          Batch #{errorDialog} Validation Errors
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loadingErrors ? (
            <CircularProgress size={24} />
          ) : batchErrors.length === 0 ? (
            <Typography>No detailed error rows found.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>CompId</TableCell>
                  <TableCell>Error Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batchErrors.map((err) => (
                  <TableRow key={err.id}>
                    <TableCell>{err.rowNumber}</TableCell>
                    <TableCell>{err.compId || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#B91C1C' }}>{err.errorMessage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
