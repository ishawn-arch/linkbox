import { Box, Chip, MenuItem, Select } from '@mui/material';
import { Badge } from './Badge';

export interface StatusBadgeProps {
  currentStatus: 'linked' | 'in_progress' | 'archived';
  tone: 'gray' | 'blue' | 'green' | 'amber';
  investmentId: number;
  onStatusChange: (
    investmentId: number,
    newStatus: 'linked' | 'in_progress' | 'archived',
  ) => void;
}

export const StatusBadge = ({
  currentStatus,
  tone,
  investmentId,
  onStatusChange,
}: StatusBadgeProps) => {
  const chipColorMap = {
    gray: 'default' as const,
    blue: 'primary' as const,
    green: 'success' as const,
    amber: 'warning' as const,
  };

  return (
    <Select
      value={currentStatus}
      onChange={(e) =>
        onStatusChange(
          investmentId,
          e.target.value as 'linked' | 'in_progress' | 'archived',
        )
      }
      size='small'
      sx={(theme) => {
        const getBorderColor = () => {
          switch (chipColorMap[tone]) {
            case 'primary':
              return theme.palette.primary.main;
            case 'success':
              return theme.palette.success.main;
            case 'warning':
              return theme.palette.warning.main;
            case 'default':
            default:
              return theme.palette.grey[500];
          }
        };

        const borderColor = getBorderColor();

        return {
          minWidth: 'auto',
          height: '20px',
          fontSize: '10px',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          '& .MuiSelect-select': {
            paddingX: '0px',
            paddingY: '0px',
            color: borderColor,
            backgroundColor: 'transparent',
            border: 'none',
            '&:focus': {
              backgroundColor: 'transparent',
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiSelect-icon': {
            fontSize: '12px',
            color: borderColor,
            right: '4px',
          },
        };
      }}
      MenuProps={{
        sx: {
          '& .MuiPaper-root': {
            minWidth: 120,
          },
        },
      }}
      renderValue={() => {
        const statusText = currentStatus.replace('_', ' ');

        return (
          <Chip
            label={statusText}
            color={chipColorMap[tone]}
            size='small'
            variant='outlined'
            sx={{
              fontSize: '10px',
              height: '20px',
              cursor: 'pointer',
              border: 'none !important', // Remove chip's own border since Select has it
              '& .MuiChip-label': {
                paddingX: '6px',
              },
            }}
          />
        );
      }}
    >
      <MenuItem value='in_progress' sx={{ fontSize: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge text='in progress' tone='amber' />
        </Box>
      </MenuItem>
      <MenuItem value='linked' sx={{ fontSize: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge text='linked' tone='green' />
        </Box>
      </MenuItem>
      <MenuItem value='archived' sx={{ fontSize: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge text='archived' tone='gray' />
        </Box>
      </MenuItem>
    </Select>
  );
};
