import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, History, RefreshCw } from 'lucide-react';
import { outboundApi } from '../services/outboundApi';

export default function OutboundUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await outboundApi.getImportHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load Outbound import history:', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }

    setFile(selected);
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const previewData = await outboundApi.previewImport(selected);
      setPreview(previewData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to inspect CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await outboundApi.uploadImport(file);
      setMessage(`Import Completed! Batch #${result.batchId}: ${result.insertedRows.toLocaleString()} calls inserted in ${result.durationSeconds}s.`);
      setFile(null);
      setPreview(null);
      loadHistory();
      // Notify Outbound dashboard hooks to invalidate and refresh immediately
      window.dispatchEvent(new CustomEvent('outbound:data-uploaded', { detail: result }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          Upload Outbound CDR Files
        </Typography>
        <Typography sx={{ fontSize: '12px', color: '#64748B', mt: '2px' }}>
          Import and audit outbound telephony records (Supports all standard campaign CSV headers)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
          {message}
        </Alert>
      )}

      {/* Upload Box */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          bgcolor: '#FFFFFF',
          borderRadius: '10px',
          border: '2px dashed #CBD5E1',
          textAlign: 'center',
          '&:hover': { borderColor: '#0284C7' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <UploadCloud size={40} color="#0284C7" strokeWidth={1.5} />
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', mt: 1 }}>
            Select or drag and drop Outbound Telephony CSV
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.5, mb: 2 }}>
            Files up to 100 MB supported with automatic column aliasing and deduplication
          </Typography>

          <Button
            variant="contained"
            component="label"
            sx={{
              bgcolor: '#0284C7',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '6px',
              px: 3,
              '&:hover': { bgcolor: '#0369A1' }
            }}
          >
            Choose CSV File
            <input type="file" accept=".csv" hidden onChange={handleFileChange} />
          </Button>

          {file && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText size={16} color="#64748B" />
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Preview Section */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: '#0284C7', mr: 1.5 }} />
          <Typography sx={{ fontSize: '13px', color: '#64748B' }}>
            Validating CSV headers and row structure...
          </Typography>
        </Box>
      )}

      {preview && !loading && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            bgcolor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                File Validation & Header Mapping Preview
              </Typography>
              <Typography sx={{ fontSize: '11.5px', color: '#64748B' }}>
                {preview.recognizedHeaders.length} recognized column mappings • Total File Rows: <strong>{(preview.totalRows || 0).toLocaleString()}</strong> • Sample Preview: <strong>{preview.sampleRows?.length || 0}</strong> rows
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || (preview.missingHeaders && preview.missingHeaders.length > 0)}
              sx={{
                bgcolor: (preview.missingHeaders && preview.missingHeaders.length > 0) ? '#94A3B8' : '#059669',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '6px',
                px: 3,
                '&:hover': { bgcolor: (preview.missingHeaders && preview.missingHeaders.length > 0) ? '#94A3B8' : '#047857' }
              }}
            >
              {uploading ? 'Importing Rows...' : 'Confirm & Ingest Records'}
            </Button>
          </Box>

          {preview.validationErrors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {preview.validationErrors.map((err, i) => (
                <Alert key={i} severity="warning" sx={{ mb: 1, fontSize: '12px' }}>
                  {err}
                </Alert>
              ))}
            </Box>
          )}

          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569', mb: 1 }}>
            Mapped Column Headers:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {preview.recognizedHeaders.map((h, i) => (
              <Chip key={i} label={h} size="small" sx={{ fontSize: '10.5px', bgcolor: '#F0F9FF', color: '#0369A1' }} />
            ))}
          </Box>
        </Paper>
      )}

      {/* History Audit Table */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History size={18} color="#0284C7" />
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Outbound Import Batch History
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={loadHistory}
            startIcon={<RefreshCw size={13} />}
            sx={{ fontSize: '11px', textTransform: 'none', color: '#64748B' }}
          >
            Refresh History
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Batch ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>File Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Total Rows</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Inserted</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Imported At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#94A3B8', fontSize: '12px' }}>
                    No import batches found.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((batch) => (
                  <TableRow key={batch.id} hover>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>#{batch.id}</TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#0F172A' }}>{batch.fileName}</TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>{batch.totalRows?.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      {batch.insertedRows?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={batch.status}
                        size="small"
                        sx={{
                          fontSize: '10px',
                          height: '20px',
                          bgcolor: batch.status === 'Completed' ? '#ECFDF5' : '#FEF2F2',
                          color: batch.status === 'Completed' ? '#059669' : '#DC2626',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#64748B' }}>{batch.durationSeconds}s</TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#64748B' }}>
                      {new Date(batch.importedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
