import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  Typography, 
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Shield, 
  Headphones, 
  PhoneOutgoing, 
  ChevronDown, 
  Check 
} from 'lucide-react';

export const MODULES = [
  {
    id: 'grievance',
    name: 'Beneficiary Grievance',
    shortName: 'Grievance',
    icon: Shield,
    color: '#008080',
    available: true,
    description: 'Beneficiary redressal, ageing & risk analytics'
  },
  {
    id: 'inbound',
    name: 'Inbound Call Analytics',
    shortName: 'Inbound',
    icon: Headphones,
    color: '#235789',
    available: true,
    description: 'Call center telephony, traffic & agent utilization'
  },
  {
    id: 'outbound',
    name: 'Outbound Call Analytics',
    shortName: 'Outbound',
    icon: PhoneOutgoing,
    color: '#64748B',
    available: false,
    badge: 'Coming Soon',
    description: 'Outbound campaigns & beneficiary follow-up'
  }
];

export default function ModuleSwitcher({ activeModule = 'grievance', onSelectModule, isMobile = false }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentModule = MODULES.find((m) => m.id === activeModule) || MODULES[0];
  const CurrentIcon = currentModule.icon;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (module) => {
    if (!module.available) return;
    if (onSelectModule) {
      onSelectModule(module.id);
    }
    handleClose();
  };

  return (
    <Box sx={{ width: '100%', mb: isMobile ? 0 : 1.5 }}>
      <Tooltip title="Switch Analytics Module" placement="right" disableHoverListener={isMobile}>
        <Button
          onClick={handleClick}
          fullWidth
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label={`Current module: ${currentModule.name}. Click to switch module.`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#F1F5F9',
            color: '#0D3B66',
            borderRadius: '8px',
            px: '8px',
            py: '6px',
            minHeight: '36px',
            textTransform: 'none',
            border: '1px solid #E2E8F0',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#E2E8F0',
              borderColor: '#CBD5E1',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexGrow: 1 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '5px',
                bgcolor: currentModule.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <CurrentIcon size={13} strokeWidth={2.4} />
            </Box>
            <Typography
              sx={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0D3B66',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'left',
                minWidth: 0,
                flexGrow: 1
              }}
            >
              {isMobile ? currentModule.shortName : currentModule.name}
            </Typography>
          </Box>
          <ChevronDown size={14} color="#64748B" style={{ flexShrink: 0, marginLeft: 4 }} />
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 0.75,
            width: isMobile ? 220 : 230,
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            p: 0.5
          }
        }}
      >
        <Typography sx={{ px: 1.5, py: 0.5, fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>
          SELECT MODULE
        </Typography>

        {MODULES.map((module) => {
          const Icon = module.icon;
          const isSelected = activeModule === module.id;

          return (
            <MenuItem
              key={module.id}
              onClick={() => handleSelect(module)}
              disabled={!module.available}
              selected={isSelected}
              sx={{
                borderRadius: '6px',
                py: 0.75,
                px: 1.25,
                my: 0.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: isSelected ? '#F0F9FF !important' : 'transparent',
                opacity: module.available ? 1 : 0.6,
                cursor: module.available ? 'pointer' : 'not-allowed',
                '&:hover': {
                  bgcolor: module.available ? (isSelected ? '#F0F9FF' : '#F8FAFC') : 'transparent'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '5px',
                    bgcolor: module.available ? module.color : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <Icon size={13} strokeWidth={2.4} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? '#0D3B66' : (module.available ? '#1E293B' : '#94A3B8'),
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {module.name}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#64748B', lineHeight: 1.1 }}>
                    {module.available 
                      ? (module.id === 'grievance' ? 'Grievance Redressal' : 'Inbound Telephony') 
                      : 'Outbound Campaigns'}
                  </Typography>
                </Box>
              </Box>

              {isSelected && (
                <Check size={14} color="#008080" strokeWidth={2.5} style={{ marginLeft: 6, flexShrink: 0 }} />
              )}

              {module.badge && (
                <Chip
                  label={module.badge}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '9px',
                    fontWeight: 700,
                    bgcolor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                    ml: 1,
                    '& .MuiChip-label': { px: 0.75 }
                  }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
