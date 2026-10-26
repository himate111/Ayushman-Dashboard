import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  LinearProgress, 
  Alert, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Chip, 
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { previewImportFile, executeImportFile } from '../api/importApi';

export default function UploadReport({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [executeResult, setExecuteResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setExecuteResult(null);
    setIsPreviewing(true);

    try {
      const preview = await previewImportFile(selectedFile);
      setPreviewData(preview);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to inspect and validate uploaded file.');
      setPreviewData(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setIsExecuting(true);
    setError(null);

    try {
      const result = await executeImportFile(file, 'Executive Administrator');
      setExecuteResult(result);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error('Execute import error:', err);
      setError(err.response?.data?.message || 'Failed to execute import into MSSQL.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setExecuteResult(null);
    setError(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D3B66', mb: 0.5 }}>
          Upload Beneficiary Grievance Report
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Import Excel (.xlsx, .xls) or CSV grievance data with automatic duplicate detection, history preserving updates, and MSSQL permanent storage.
        </Typography>
      </Box>

      {/* Upload Zone */}
      {!previewData && !executeResult && (
        <Paper
          elevation={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 6,
            textAlign: 'center',
            border: `2px dashed ${isDragging ? '#008080' : '#CBD5E1'}`,
            borderRadius: '16px',
            bgcolor: isDragging ? '#F0FDFA' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            mb: 3,
            '&:hover': { borderColor: '#0D3B66', bgcolor: '#F8FAFC' },
          }}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          <Box sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: '16px', 
            bgcolor: '#E0F2FE', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 2 
          }}>
            <UploadCloud size={36} color="#0D3B66" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66', mb: 0.5 }}>
            Drag and drop grievance report here
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Supports Beneficiary Reports from Ayushman Bharat PM-JAY (.xlsx, .xls, .csv up to 100MB)
          </Typography>
          <Button variant="contained" sx={{ bgcolor: '#0D3B66', px: 3, py: 1 }}>
            Browse File
          </Button>
        </Paper>
      )}

      {/* Loading Progress */}
      {(isPreviewing || isExecuting) && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: '12px', mb: 3 }}>
          <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0D3B66' }}>
            {isPreviewing ? 'Validating schema and identifying duplicate records...' : 'Executing high-speed MSSQL batch import & audit logging...'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Performing conflict detection, age bucket recalculation, and risk keyword analysis.
          </Typography>
        </Paper>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Execution Success Result Card */}
      {executeResult && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #A7F3D0', bgcolor: '#ECFDF5', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircle size={36} color="#059669" />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#065F46' }}>
                Import Completed Successfully!
              </Typography>
              <Typography variant="body2" sx={{ color: '#047857' }}>
                {executeResult.message}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Total Processed</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D3B66' }}>
                  {executeResult.totalRecords?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#059669' }}>New Grievances Added</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                  {executeResult.newRecordsCount?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#D97706' }}>Existing Cases Updated</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                  {executeResult.updatedRecordsCount?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Unchanged / Duplicates Skipped</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B' }}>
                  {executeResult.unchangedRecordsCount?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="contained" onClick={handleReset} sx={{ bgcolor: '#0D3B66' }}>
              Upload Another Report
            </Button>
          </Box>
        </Paper>
      )}

      {/* Preview Section */}
      {previewData && !executeResult && (
        <Box>
          {/* Validation Warnings / Duplicate File Alerts */}
          {previewData.validationErrors && previewData.validationErrors.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              {previewData.validationErrors.map((err, i) => (
                <Alert 
                  key={i} 
                  severity={err.toLowerCase().includes('duplicate') ? 'warning' : 'error'} 
                  sx={{ mb: 1, borderRadius: '8px', fontWeight: 600 }}
                >
                  {err}
                </Alert>
              ))}
            </Box>
          )}

          {/* Summary Breakdown Cards */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FileSpreadsheet size={24} color="#0D3B66" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D3B66' }}>
                    {previewData.fileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    File Size: {(previewData.fileSize / (1024 * 1024)).toFixed(2)} MB • {previewData.totalRows} sample rows analyzed
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" color="inherit" onClick={handleReset} disabled={isExecuting}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleConfirmImport} 
                  disabled={isExecuting}
                  startIcon={<FileCheck size={18} />}
                  sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                >
                  Confirm & Commit to MSSQL
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                  <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600 }}>New Records</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0369A1' }}>
                    {previewData.newCount?.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>Updates (Status/Officer)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#B45309' }}>
                    {previewData.updateCount?.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Unchanged (Skipped)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B' }}>
                    {previewData.unchangedCount?.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 600 }}>Validation Errors</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#B91C1C' }}>
                    {previewData.invalidCount || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Sample Rows Preview Table */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D3B66', mb: 2 }}>
              Sample Extracted Grievances (Top {previewData.sampleRows?.length} rows)
            </Typography>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Action Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>CompId</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>District</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Reason / SubCategory</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Assigned Officer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.sampleRows?.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Chip
                          label={row.actionType}
                          size="small"
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            bgcolor: row.actionType === 'New' ? '#DCFCE7' : (row.actionType === 'Update' ? '#FEF3C7' : '#F1F5F9'),
                            color: row.actionType === 'New' ? '#166534' : (row.actionType === 'Update' ? '#92400E' : '#475569'),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>{row.compId}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.compDate}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>
                        <span className={`badge-${row.status?.toLowerCase() || 'open'}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.district}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.category}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.grievanceType}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.officerName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
