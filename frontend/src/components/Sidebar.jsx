import React from 'react';
import { 
  Box, 
  List, 
  ListItemButton, 
  Typography, 
  Divider,
  Tooltip,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Search, 
  CheckCircle2, 
  Settings,
  Shield,
  LogOut,
  LogIn,
  User,
  Lightbulb
} from 'lucide-react';
import ModuleSwitcher from './ModuleSwitcher';

const GRIEVANCE_MENU_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'insights', label: 'Insights Explorer', icon: Lightbulb },
  { id: 'upload', label: 'Upload Grievance Report', icon: UploadCloud },
  { id: 'history', label: 'Upload History', icon: History },
  { id: 'explorer', label: 'Grievance Explorer', icon: Search },
  { id: 'quality', label: 'Data Quality & Audit', icon: CheckCircle2 },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

const INBOUND_MENU_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, available: true },
  { id: 'insights', label: 'Insights Explorer', icon: Lightbulb, available: true },
  { id: 'upload', label: 'Upload Call Records', icon: UploadCloud, available: true },
  { id: 'history', label: 'Upload History', icon: History, available: true },
  { id: 'explorer', label: 'Call Records Explorer', icon: Search, available: true },
  { id: 'quality', label: 'Data Quality & Audit', icon: CheckCircle2, available: true },
  { id: 'settings', label: 'System Settings', icon: Settings, available: true },
];

const OUTBOUND_MENU_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, available: true },
  { id: 'insights', label: 'Insights Explorer', icon: Lightbulb, available: true },
  { id: 'upload', label: 'Upload Call Records', icon: UploadCloud, available: true },
  { id: 'history', label: 'Upload History', icon: History, available: true },
  { id: 'explorer', label: 'Call Records Explorer', icon: Search, available: true },
  { id: 'quality', label: 'Data Quality & Audit', icon: CheckCircle2, available: true },
  { id: 'settings', label: 'System Settings', icon: Settings, available: true },
];

export default function Sidebar({ 
  activeModule = 'grievance', 
  onSelectModule, 
  activeTab, 
  onSelectTab, 
  user, 
  onLogout 
}) {
  const userInitial = ((user?.username || (user ? 'A' : '?'))[0] || '?').toUpperCase();
  const displayRole = user?.role || (user ? 'Administrator' : 'Sign In Required');
  const displayUsername = user?.username || (user ? 'admin' : 'Guest');
  const menuItems = activeModule === 'inbound' 
    ? INBOUND_MENU_ITEMS 
    : activeModule === 'outbound' 
    ? OUTBOUND_MENU_ITEMS 
    : GRIEVANCE_MENU_ITEMS;

  return (
    <Box
      component="nav"
      aria-label="Navigation Sidebar"
      sx={{
        width: { xs: '100%', sm: 210 },
        minWidth: { xs: 0, sm: 210 },
        maxWidth: { xs: '100%', sm: 210 },
        bgcolor: '#FFFFFF',
        borderRight: { sm: '1px solid #E2E8F0' },
        borderBottom: { xs: '1px solid #E2E8F0', sm: 'none' },
        minHeight: { sm: '100vh' },
        height: { xs: 'auto', sm: '100vh' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: { xs: 1, sm: 2 },
        px: '12px',
        boxSizing: 'border-box',
        flexShrink: 0,
        overflow: { xs: 'hidden', sm: 'visible' }
      }}
    >
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflow: { xs: 'hidden', sm: 'visible' } }}>
        {/* Brand Header inside Sidebar */}
        <Box 
          sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1.25, 
            px: 0.5, 
            pb: 1.5, 
            mb: 1.25, 
            borderBottom: '1px solid #F1F5F9' 
          }}
        >
          <Box 
            sx={{ 
              width: 30, 
              height: 30, 
              borderRadius: '7px', 
              bgcolor: '#0D3B66', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#00E5FF',
              flexShrink: 0
            }}
          >
            <Shield size={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              sx={{ 
                fontWeight: 800, 
                color: '#0D3B66', 
                fontSize: '13px', 
                lineHeight: 1.2, 
                letterSpacing: '-0.02em', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}
            >
              आयुष्मान संपर्क
            </Typography>
            <Typography 
              sx={{ 
                color: '#64748B', 
                fontSize: '10px', 
                lineHeight: 1.1, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}
            >
              PM-JAY Grievance
            </Typography>
          </Box>
        </Box>

        {/* Module Switcher (Desktop) */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <ModuleSwitcher 
            activeModule={activeModule} 
            onSelectModule={onSelectModule} 
          />
        </Box>

        {/* Mobile Header Bar (Only visible on xs) */}
        <Box 
          sx={{ 
            display: { xs: 'flex', sm: 'none' }, 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            px: 0.5, 
            pb: 1, 
            mb: 1, 
            borderBottom: '1px solid #F1F5F9' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 26, 
                height: 26, 
                borderRadius: '6px', 
                bgcolor: '#0D3B66', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#00E5FF' 
              }}
            >
              <Shield size={15} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#0D3B66', fontSize: '13px' }}>
              आयुष्मान संपर्क
            </Typography>
          </Box>

          {/* User info on mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: '#0D3B66', fontSize: '11px', fontWeight: 700 }}>
              {userInitial}
            </Avatar>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#0D3B66' }}>
              {displayUsername}
            </Typography>
            {onLogout && (
              <IconButton onClick={onLogout} size="small" sx={{ p: 0.5, color: '#94A3B8' }}>
                <LogOut size={15} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Module Switcher (Mobile) */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 1 }}>
          <ModuleSwitcher 
            activeModule={activeModule} 
            onSelectModule={onSelectModule} 
            isMobile={true} 
          />
        </Box>

        <Typography 
          variant="overline" 
          sx={{ 
            px: 0.5, 
            fontWeight: 800, 
            color: '#94A3B8', 
            letterSpacing: '0.06em', 
            fontSize: '10px',
            display: { xs: 'none', sm: 'block' },
            mb: 0.75,
            lineHeight: 1.5,
          }}
        >
          {activeModule === 'inbound' ? 'INBOUND NAVIGATION' : 'GRIEVANCE NAVIGATION'}
        </Typography>

        <List 
          sx={{ 
            p: 0, 
            m: 0,
            width: '100%',
            display: { xs: 'flex', sm: 'block' },
            overflowX: { xs: 'auto', sm: 'visible' },
            maxWidth: '100%',
            minWidth: 0,
            gap: { xs: 1, sm: 0 },
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 },
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isAvailable = item.available !== false;
            const isSelected = activeTab === item.id && isAvailable;
            const activeColor = activeModule === 'inbound' ? '#235789' : '#008080';

            return (
              <Tooltip 
                key={item.id} 
                title={!isAvailable ? `${item.label} (Planned for Future Telephony Feeds)` : item.label} 
                placement="right" 
                arrow 
                enterDelay={400}
              >
                <span>
                  <ListItemButton
                    onClick={() => isAvailable && onSelectTab(item.id)}
                    selected={isSelected}
                    disabled={!isAvailable}
                    disableGutters
                    sx={{
                      borderRadius: '7px',
                      height: { xs: 38, sm: 46 },
                      minHeight: { xs: 38, sm: 46 },
                      maxHeight: { xs: 38, sm: 46 },
                      mb: { xs: 0, sm: '7px' },
                      px: '8px',
                      py: 0,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: isSelected ? '#0D3B66' : (isAvailable ? '#475569' : '#94A3B8'),
                      backgroundColor: isSelected ? '#F0F9FF !important' : 'transparent',
                      borderLeft: isSelected ? `4px solid ${activeColor}` : '4px solid transparent',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden',
                      opacity: isAvailable ? 1 : 0.6,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      '&:hover': {
                        backgroundColor: isAvailable ? (isSelected ? '#F0F9FF !important' : '#F8FAFC') : 'transparent',
                        color: isAvailable ? '#0D3B66' : '#94A3B8',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        pointerEvents: 'auto'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 18, 
                        minWidth: 18, 
                        height: 18, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: isSelected ? activeColor : (isAvailable ? '#64748B' : '#94A3B8'),
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} strokeWidth={isSelected ? 2.2 : 1.9} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.015em',
                        color: 'inherit',
                        minWidth: 0,
                        flexGrow: 1,
                      }}
                    >
                      {item.label}
                    </Typography>
                    {item.badge && (
                      <Chip 
                        label={item.badge} 
                        size="small" 
                        sx={{ 
                          height: 16, 
                          fontSize: '8.5px', 
                          fontWeight: 700, 
                          bgcolor: '#F1F5F9', 
                          color: '#64748B', 
                          border: '1px solid #CBD5E1', 
                          ml: 'auto',
                          flexShrink: 0,
                          '& .MuiChip-label': { px: 0.5 }
                        }} 
                      />
                    )}
                  </ListItemButton>
                </span>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Bottom Compact User Profile Section (Desktop / Tablet) */}
      <Box sx={{ display: { xs: 'none', sm: 'block' }, pt: 1 }}>
        <Divider sx={{ mb: 1.5, borderColor: '#F1F5F9' }} />
        <Box 
          sx={{ 
            p: '8px 10px', 
            bgcolor: '#F8FAFC', 
            borderRadius: '8px', 
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexGrow: 1 }}>
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: '#0D3B66', 
                color: '#FFFFFF', 
                fontSize: '12px', 
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography 
                sx={{ 
                  fontWeight: 700, 
                  color: '#0D3B66', 
                  fontSize: '12px', 
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayUsername}
              </Typography>
              <Typography 
                sx={{ 
                  color: '#64748B', 
                  fontSize: '11px', 
                  lineHeight: 1.2, 
                  mt: 0.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayRole}
              </Typography>
            </Box>
          </Box>

          {user ? (
            onLogout && (
              <Tooltip title="Log Out" placement="top">
                <IconButton
                  onClick={onLogout}
                  size="small"
                  aria-label="Log Out"
                  sx={{
                    color: '#94A3B8',
                    p: 0.5,
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' },
                  }}
                >
                  <LogOut size={15} />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Tooltip title="Sign In" placement="top">
              <IconButton
                onClick={() => window.dispatchEvent(new CustomEvent('auth:unauthorized'))}
                size="small"
                aria-label="Sign In"
                sx={{
                  color: '#0284C7',
                  p: 0.5,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  '&:hover': { color: '#0369A1', bgcolor: '#F0F9FF' },
                }}
              >
                <LogIn size={15} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}
