import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { Store, Investment } from '../../utils/db';
import { Badge } from '../common/Badge';
import { sortInvestmentsByDefault } from '../../utils/investments';

export interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  to: string;
  onToChange: (value: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  selectedInvestments: number[];
  onSelectedInvestmentsChange: (investments: number[]) => void;
  processInvestments: Investment[];
  store: Store | null;
}

export const NewConversationModal = ({
  open,
  onClose,
  onSubmit,
  to,
  onToChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  selectedInvestments,
  onSelectedInvestmentsChange,
  processInvestments,
  store,
}: NewConversationModalProps) => {
  const handleClose = () => {
    onToChange('');
    onSubjectChange('');
    onBodyChange('');
    onSelectedInvestmentsChange([]);
    onClose();
  };

  const handleInvestmentToggle = (investmentId: number) => {
    if (selectedInvestments.includes(investmentId)) {
      onSelectedInvestmentsChange(
        selectedInvestments.filter((id) => id !== investmentId),
      );
    } else {
      onSelectedInvestmentsChange([...selectedInvestments, investmentId]);
    }
  };

  const handleRemoveInvestment = (investmentId: number) => {
    onSelectedInvestmentsChange(selectedInvestments.filter((id) => id !== investmentId));
  };

  const isSubmitDisabled = !to.trim() || !subject.trim() || !body.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle>New Conversation</DialogTitle>
      <DialogContent>
        <Stack direction='row' spacing={3} sx={{ mt: 1, height: '500px' }}>
          {/* Left side - Form */}
          <Box sx={{ flex: '1', minWidth: '300px' }}>
            <Stack spacing={2}>
              <TextField
                label='To'
                placeholder='admin@example.com'
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                fullWidth
                variant='outlined'
                size='small'
              />
              <TextField
                label='Subject'
                placeholder='Enter subject line'
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                fullWidth
                variant='outlined'
                size='small'
              />
              <TextField
                label='Body'
                placeholder='Type your message...'
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                fullWidth
                multiline
                rows={12}
                variant='outlined'
              />
              {selectedInvestments.length > 0 && (
                <Box>
                  <Typography variant='subtitle2' gutterBottom color='text.secondary'>
                    Selected Investments ({selectedInvestments.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedInvestments.map((investmentId) => {
                      const investment = store?.investments[investmentId];
                      return (
                        <Chip
                          key={investmentId}
                          label={`#${investmentId} - ${investment?.investingEntity}`}
                          size='small'
                          onDelete={() => handleRemoveInvestment(investmentId)}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Right side - Investments Panel */}
          <Box sx={{ width: '300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title='Select Investments'
                subheader={`${selectedInvestments.length} of ${processInvestments.length} selected`}
                slotProps={{
                  title: { variant: 'h6' },
                  subheader: { variant: 'caption' },
                }}
              />
              <Box
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              />
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List disablePadding>
                  {sortInvestmentsByDefault(processInvestments).map((inv) => (
                    <ListItem key={inv.id} disablePadding>
                      <ListItemButton
                        selected={selectedInvestments.includes(inv.id)}
                        onClick={() => handleInvestmentToggle(inv.id)}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={selectedInvestments.includes(inv.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
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
                                <Badge
                                  text={inv.status.replace('_', ' ')}
                                  tone={
                                    inv.status === 'linked'
                                      ? 'green'
                                      : inv.status === 'in_progress'
                                      ? 'amber'
                                      : 'gray'
                                  }
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
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant='contained'
          disabled={isSubmitDisabled}
          startIcon={<SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};
