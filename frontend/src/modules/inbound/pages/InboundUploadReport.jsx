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
  Divider
} from '@mui/material';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  RefreshCw, 
  PhoneCall,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  PhoneOff
} from 'lucide-react';
import { previewInboundImportFile, executeInboundImportFile } from '../../../api/inboundImportApi';

export default function InboundUploadReport({ onUploadSuccess }) {
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
      const preview = await previewInboundImportFile(selectedFile);
      setPreviewData(preview);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to inspect and validate uploaded telephony file.');
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
      const result = await executeInboundImportFile(file, 'Telephony Administrator');
      setExecuteResult(result);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error('Execute import error:', err);
      setError(err.response?.data?.message || 'Failed to execute telephony batch import into SQL Server.');
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
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#235789', mb: 0.5 }}>
          Upload Inbound Call Records (CDR)
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Import telephony call detail records from Excel (.xlsx, .xls) or CSV with automatic duplicate skipping, caller privacy masking, and SQL Server transaction protection.
        </Typography>
      </Box>

      {/* Upload Drop Zone */}
      {!previewData && !executeResult && (
        <Paper
          elevation={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 6,
            textAlign: 'center',
            border: `2px dashed ${isDragging ? '#235789' : '#CBD5E1'}`,
            borderRadius: '16px',
            bgcolor: isDragging ? '#EFF6FF' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            mb: 3,
            '&:hover': { borderColor: '#235789', bgcolor: '#F8FAFC' },
          }}
          onClick={() => document.getElementById('inbound-file-upload-input').click()}
        >
          <input
            id="inbound-file-upload-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          <Box sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: '16px', 
            bgcolor: '#EFF6FF', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 2 
          }}>
            <UploadCloud size={36} color="#235789" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#235789', mb: 0.5 }}>
            Drag and drop telephony CDR report here
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Supports PBX / ACD Call Detail Records (.xlsx, .xls, .csv up to 100MB)
          </Typography>
          <Button variant="contained" sx={{ bgcolor: '#235789', px: 3, py: 1, '&:hover': { bgcolor: '#1a4369' } }}>
            Browse Telephony File
          </Button>
        </Paper>
      )}

      {/* Loading Progress */}
      {(isPreviewing || isExecuting) && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: '12px', mb: 3 }}>
          <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#235789' }}>
            {isPreviewing ? 'Inspecting telephony schema, validating call timestamps and checking duplicate keys...' : 'Executing high-speed SQL Server batch bulk copy & audit logging...'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Processing call_end classifications, duration normalizations, and caller number privacy protection.
          </Typography>
        </Paper>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Execution Success Card */}
      {executeResult && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #A7F3D0', bgcolor: '#ECFDF5', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircle size={36} color="#059669" />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#065F46' }}>
                Telephony Import Completed Successfully!
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
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#235789' }}>
                  {executeResult.totalRecords?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#059669' }}>New Calls Added</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                  {executeResult.newRecordsCount?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Duplicate Calls Skipped</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B' }}>
                  {executeResult.duplicateRecordsCount?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                <Typography variant="caption" sx={{ color: '#DC2626' }}>Invalid Rows Rejected</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#DC2626' }}>
                  {executeResult.errorRecordsCount?.toLocaleString() || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="contained" onClick={handleReset} sx={{ bgcolor: '#235789', '&:hover': { bgcolor: '#1a4369' } }}>
              Upload Another Call Report
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

          {/* Metric Summary Breakdown Cards */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FileSpreadsheet size={24} color="#235789" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#235789' }}>
                    {previewData.fileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    File Size: {(previewData.fileSize / (1024 * 1024)).toFixed(2)} MB • {previewData.totalRows} sample calls analyzed
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
                  disabled={isExecuting || (previewData.newCount === 0 && previewData.duplicateCount > 0)}
                  startIcon={<FileCheck size={18} />}
                  sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                >
                  Confirm & Commit to Telephony Database
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                  <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600 }}>New Calls (Approved)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0369A1' }}>
                    {previewData.newCount?.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Duplicates (Skipped)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B' }}>
                    {previewData.duplicateCount?.toLocaleString()}
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

              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>Total Analyzed</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857' }}>
                    {previewData.totalRows?.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Sample Rows Preview Table */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#235789', mb: 2 }}>
              Sample Extracted Call Records (Top {previewData.sampleRows?.length} calls)
            </Typography>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Call ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Arrival Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Caller (Masked)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Call End / Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Talk Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Queue Wait</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Disposition / Sub-Category</TableCell>
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
                            bgcolor: row.actionType === 'New' ? '#DCFCE7' : (row.actionType === 'Duplicate' ? '#F1F5F9' : '#FEE2E2'),
                            color: row.actionType === 'New' ? '#166534' : (row.actionType === 'Duplicate' ? '#475569' : '#991B1B'),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
                        {row.callId ? `#${row.callId}` : 'Auto-Assigned'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.callTime}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.maskedCallerNo}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>
                        <Chip
                          label={row.callEnd}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: row.callEnd === 'Agent' ? '#ECFDF5' : '#FEF2F2',
                            color: row.callEnd === 'Agent' ? '#059669' : '#DC2626',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.agentId || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{row.agentDuration}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{row.queueDuration}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>
                        {row.disposition} {row.subDisposition && row.subDisposition !== '-' ? `• ${row.subDisposition}` : ''}
                      </TableCell>
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
