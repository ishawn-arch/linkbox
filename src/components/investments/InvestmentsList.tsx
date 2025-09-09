import {
  Box,
  Card,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as ManageIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import type { Investment } from '../../utils/db';
import { Badge } from '../common/Badge';
import { StatusBadge } from '../common/StatusBadge';
import {
  sortInvestmentsByDefault,
  filterInvestmentsByStatus,
  type InvestmentCounts,
} from '../../utils/investments';

export interface InvestmentsListProps {
  title: string;
  investments: Investment[];
  counts: InvestmentCounts;
  statusFilter: string | null;
  onStatusFilterToggle: (status: string) => void;
  onStatusChange: (
    investmentId: number,
    newStatus: 'linked' | 'in_progress' | 'archived',
  ) => void;
  showManageActions?: boolean;
  onEditInvestments?: () => void;
  onAddInvestments?: () => void;
  onRemoveInvestments?: () => void;
}

export const InvestmentsList = ({
  title,
  investments,
  counts,
  statusFilter,
  onStatusFilterToggle,
  onStatusChange,
  showManageActions = false,
  onEditInvestments,
  onAddInvestments,
  onRemoveInvestments,
}: InvestmentsListProps) => {
  const filteredInvestments = filterInvestmentsByStatus(investments, statusFilter);
  const sortedInvestments = sortInvestmentsByDefault(filteredInvestments);

  const renderActions = () => {
    if (showManageActions && onEditInvestments) {
      return (
        <IconButton
          onClick={onEditInvestments}
          color='default'
          size='small'
          title='Manage investments in this conversation'
        >
          <ManageIcon />
        </IconButton>
      );
    } else if (!showManageActions && onAddInvestments && onRemoveInvestments) {
      return (
        <Stack direction='row' spacing={0.5}>
          <IconButton
            onClick={onAddInvestments}
            color='default'
            size='small'
            title='Add investments to this process'
          >
            <AddIcon />
          </IconButton>
          <IconButton
            onClick={onRemoveInvestments}
            color='default'
            size='small'
            title='Remove investments from this process'
            disabled={investments.length === 0}
          >
            <RemoveIcon />
          </IconButton>
        </Stack>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader
        title={title}
        action={renderActions()}
        slotProps={{
          title: { variant: 'h6' },
        }}
      />
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Badge
            text={`${counts.inProgress} in progress`}
            tone='amber'
            selected={statusFilter === 'in_progress'}
            onClick={() => onStatusFilterToggle('in_progress')}
          />
          <Badge
            text={`${counts.linked} linked`}
            tone='green'
            selected={statusFilter === 'linked'}
            onClick={() => onStatusFilterToggle('linked')}
          />
          <Badge
            text={`${counts.archived} archived`}
            tone='gray'
            selected={statusFilter === 'archived'}
            onClick={() => onStatusFilterToggle('archived')}
          />
        </Stack>
      </Box>
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
        }}
      />
      <Box>
        <List disablePadding>
          {sortedInvestments.map((inv) => (
            <ListItem key={inv.id} disablePadding>
              <ListItemButton sx={{ py: 1.5 }}>
                <ListItemText
                  primary={
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Typography
                        variant='subtitle2'
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inv.investingEntity}
                      </Typography>
                      {inv.status && (
                        <StatusBadge
                          currentStatus={inv.status}
                          tone={
                            inv.status === 'linked'
                              ? 'green'
                              : inv.status === 'in_progress'
                              ? 'amber'
                              : 'gray'
                          }
                          investmentId={inv.id}
                          onStatusChange={onStatusChange}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant='caption' color='text.secondary'>
                        {inv.fundName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        #{inv.id}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Card>
  );
};
