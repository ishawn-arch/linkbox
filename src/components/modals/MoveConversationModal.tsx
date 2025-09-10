import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { SwapHoriz as MoveIcon } from '@mui/icons-material';
import type { Store, Convo } from '../../utils/db';
import { fmtDate, sortConversationsByPriority } from '../../utils/db';
import { Badge } from '../common/Badge';

export interface MoveConversationModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
  currentProcessId: number;
  onMoveConversations: (conversationIds: string[], targetProcessId: number) => void;
}

export const MoveConversationModal = ({
  open,
  onClose,
  store,
  currentProcessId,
  onMoveConversations,
}: MoveConversationModalProps) => {
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [targetProcessId, setTargetProcessId] = useState<number | ''>('');

  const currentProcess = store?.processes[currentProcessId];
  const processConversations = sortConversationsByPriority(
    (currentProcess?.convoIds
      .map((id) => store?.convos[id])
      .filter(Boolean) as Convo[]) || [],
  );

  // Get all other processes (excluding current one) as potential targets
  const targetProcesses = store
    ? Object.values(store.processes).filter((process) => process.id !== currentProcessId)
    : [];

  const selectedTargetProcess =
    typeof targetProcessId === 'number' ? store?.processes[targetProcessId] : null;

  const handleClose = () => {
    setSelectedConversations([]);
    setTargetProcessId('');
    onClose();
  };

  const handleConversationToggle = (conversationId: string) => {
    if (selectedConversations.includes(conversationId)) {
      setSelectedConversations(
        selectedConversations.filter((id) => id !== conversationId),
      );
    } else {
      setSelectedConversations([...selectedConversations, conversationId]);
    }
  };

  const handleMoveConversations = () => {
    if (selectedConversations.length === 0 || typeof targetProcessId !== 'number') {
      return;
    }

    onMoveConversations(selectedConversations, targetProcessId);
    handleClose();
  };

  const getConversationStateBadge = (state: Convo['state']) => {
    switch (state) {
      case 'PENDING_FUND':
        return <Badge text='pending fund reply' tone='blue' />;
      case 'PENDING_ARCH':
        return <Badge text='arch response needed' tone='amber' />;
      case 'CLOSED':
        return <Badge text='closed' tone='gray' />;
      default:
        return null;
    }
  };

  const isSubmitDisabled = selectedConversations.length === 0 || targetProcessId === '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        Move Conversations to Another Process
        {currentProcess && (
          <Typography variant='caption' color='text.secondary' display='block'>
            From: {currentProcess.firmName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Target Process Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Target Process</InputLabel>
            <Select
              value={targetProcessId}
              label='Select Target Process'
              onChange={(e) => setTargetProcessId(e.target.value as number)}
            >
              {targetProcesses.map((process) => (
                <MenuItem key={process.id} value={process.id}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant='body2' fontWeight='medium'>
                      {process.firmName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {store?.clients[process.clientId]?.name} • {process.convoIds.length}{' '}
                      conversations
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Target Process Details */}
          {selectedTargetProcess && (
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Moving to: {selectedTargetProcess.firmName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Client: {store?.clients[selectedTargetProcess.clientId]?.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Current conversations: {selectedTargetProcess.convoIds.length}
              </Typography>
            </Box>
          )}

          {/* Conversations Selection */}
          <Box>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title='Select Conversations to Move'
                subheader={`${selectedConversations.length} of ${processConversations.length} selected`}
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
                {processConversations.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      No conversations to move in this process.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {processConversations.map((convo) => (
                      <ListItem key={convo.id} disablePadding>
                        <ListItemButton
                          selected={selectedConversations.includes(convo.id)}
                          onClick={() => handleConversationToggle(convo.id)}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={selectedConversations.includes(convo.id)}
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
                                    maxWidth: '300px',
                                  }}
                                >
                                  {convo.subject}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{ ml: 2, flexShrink: 0 }}
                                >
                                  {fmtDate(convo.lastActivityAt)}
                                </Typography>
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                <Stack
                                  direction='row'
                                  spacing={0.5}
                                  sx={{ flexWrap: 'wrap', gap: 0.5 }}
                                >
                                  {getConversationStateBadge(convo.state)}
                                </Stack>
                                <Typography variant='caption' color='text.secondary'>
                                  {convo.messageCount} messages •{' '}
                                  {convo.investmentRefs.length} investments
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Card>
          </Box>

          {/* Summary */}
          {selectedConversations.length > 0 &&
            selectedTargetProcess &&
            (() => {
              // Calculate how many unique investments will be moved
              const investmentIdsToMove = new Set<number>();
              selectedConversations.forEach((convoId) => {
                const convo = store?.convos[convoId];
                if (convo) {
                  convo.investmentRefs.forEach((invId) => investmentIdsToMove.add(invId));
                }
              });
              const investmentCount = investmentIdsToMove.size;

              return (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='body2' fontWeight='medium'>
                    Summary:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Moving <strong>{selectedConversations.length} conversation(s)</strong>{' '}
                    {investmentCount > 0 && (
                      <>
                        and <strong>{investmentCount} associated investment(s)</strong>
                      </>
                    )}{' '}
                    from <strong>{currentProcess?.firmName}</strong> to{' '}
                    <strong>{selectedTargetProcess.firmName}</strong>
                  </Typography>
                  {investmentCount > 0 && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Note: Investments referenced by these conversations will also be
                      moved to maintain data integrity.
                    </Typography>
                  )}
                </Box>
              );
            })()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={handleMoveConversations}
          variant='contained'
          disabled={isSubmitDisabled}
          startIcon={<MoveIcon />}
        >
          Move Conversations
        </Button>
      </DialogActions>
    </Dialog>
  );
};
