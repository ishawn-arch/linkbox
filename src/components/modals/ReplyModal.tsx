import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { Store } from '../../utils/db';
import { fmtDate, sortConversationsByPriority } from '../../utils/db';
import { EmailComposer } from '../common/EmailComposer';

export interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
  onSendReply: (
    conversationId: string,
    message: string,
    toEmail?: string,
    fromEmail?: string,
  ) => void;
}

export const ReplyModal = ({ open, onClose, store, onSendReply }: ReplyModalProps) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');

  // Get all processes
  const processes = store ? Object.values(store.processes) : [];

  // Get conversations for selected process
  const processConversations =
    store && selectedProcessId
      ? sortConversationsByPriority(
          store.processes[Number(selectedProcessId)]?.convoIds
            .map((id: string) => store.convos[id])
            .filter(Boolean) || [],
        )
      : [];

  const selectedConversation = selectedConversationId
    ? store?.convos[selectedConversationId]
    : null;

  const handleClose = () => {
    setSelectedProcessId('');
    setSelectedConversationId('');
    onClose();
  };

  const handleSendReply = (
    to: string,
    _cc: string[],
    _bcc: string[],
    message: string,
    from?: string,
  ) => {
    if (!selectedConversationId) {
      return;
    }

    // In incoming mode, 'from' contains the firm email and 'to' is the Arch alias
    onSendReply(selectedConversationId, message, to, from);

    // Clear form and close modal
    setSelectedProcessId('');
    setSelectedConversationId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Send Reply from Firm</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Process Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Process</InputLabel>
            <Select
              value={selectedProcessId}
              label='Select Process'
              onChange={(e) => {
                setSelectedProcessId(e.target.value);
                setSelectedConversationId(''); // Reset conversation selection
              }}
            >
              {processes.map((process) => (
                <MenuItem key={process.id} value={process.id}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant='body2' fontWeight='medium'>
                      {process.firmName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {process.convoIds.length} conversations
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Conversation Selection */}
          <FormControl fullWidth disabled={!selectedProcessId}>
            <InputLabel>Select Conversation</InputLabel>
            <Select
              value={selectedConversationId}
              label='Select Conversation'
              onChange={(e) => setSelectedConversationId(e.target.value)}
            >
              {processConversations.map((convo) => (
                <MenuItem key={convo.id} value={convo.id}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant='body2' fontWeight='medium'>
                      {convo.subject}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Last activity: {fmtDate(convo.lastActivityAt)} •{' '}
                      {convo.messageCount} messages
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Email Composer */}
          {selectedProcessId && selectedConversationId && selectedConversation && (
            <EmailComposer
              key={`${selectedConversationId}-${selectedConversation?.messageCount}-${selectedConversation?.lastActivityAt}`}
              conversation={selectedConversation}
              onSend={handleSendReply}
              placeholder='Type your reply as the firm...'
              showSendButton={true}
              mode='incoming'
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
