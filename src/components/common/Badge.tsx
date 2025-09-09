import { Chip } from '@mui/material';

export interface BadgeProps {
  text: string;
  tone?: 'gray' | 'blue' | 'green' | 'amber';
  selected?: boolean;
  onClick?: () => void;
}

export const Badge = ({ text, tone = 'gray', selected = false, onClick }: BadgeProps) => {
  const colorMap = {
    gray: 'default' as const,
    blue: 'primary' as const,
    green: 'success' as const,
    amber: 'warning' as const,
  };

  return (
    <Chip
      label={text}
      color={colorMap[tone]}
      size='small'
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
      sx={{
        fontSize: '10px',
        height: '20px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
};
