import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Shield, Lock, User } from 'lucide-react';
import { login } from '../api/authApi';

export default function LoginModal({ open, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify({
          username: res.username,
          fullName: res.fullName,
          role: res.role,
          email: res.email
        }));
        if (onLoginSuccess) {
          onLoginSuccess({
            username: res.username,
            fullName: res.fullName,
            role: res.role,
            email: res.email
          });
        }
        if (onClose) onClose();
      } else {
        setError('Invalid authentication response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          p: 1,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            bgcolor: '#0D3B66',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E5FF'
          }}>
            <Shield size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0D3B66', lineHeight: 1.2 }}>
              Ayushman Sampark
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Sign In to Beneficiary Grievance Portal
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem', py: 0.5 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <TextField
              label="Username"
              size="small"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: '#94A3B8', display: 'flex' }}>
                    <User size={16} />
                  </Box>
                )
              }}
            />

            <TextField
              label="Password"
              type="password"
              size="small"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: '#94A3B8', display: 'flex' }}>
                    <Lock size={16} />
                  </Box>
                )
              }}
            />

            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
              Configured demo users: <b>admin</b> (Admin) or <b>director</b> (Executive)
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              bgcolor: '#0D3B66',
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#092540' }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
