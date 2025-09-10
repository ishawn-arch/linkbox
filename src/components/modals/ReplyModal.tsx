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
import { Send as SendIcon } from '@mui/icons-material';
import type { Store } from '../../utils/db';
import { fmtDate, sortConversationsByPriority } from '../../utils/db';
import { EmailComposer } from '../common/EmailComposer';

export interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
  processId: number;
  onSendReply: (
    conversationId: string,
    message: string,
    toEmail?: string,
    fromEmail?: string,
  ) => void;
}

export const ReplyModal = ({
  open,
  onClose,
  store,
  processId,
  onSendReply,
}: ReplyModalProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');

  // Get conversations for this process
  const processConversations =
    store && processId
      ? sortConversationsByPriority(
          store.processes[processId]?.convoIds
            .map((id) => store.convos[id])
            .filter(Boolean) || [],
        )
      : [];

  const selectedConversation = selectedConversationId
    ? store?.convos[selectedConversationId]
    : null;

  const handleClose = () => {
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
    setSelectedConversationId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Send Reply from Firm</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Conversation Selection */}
          <FormControl fullWidth>
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
          {selectedConversationId && selectedConversation && (
            <EmailComposer
              conversation={selectedConversation}
              onSend={handleSendReply}
              placeholder='Type your reply as the firm...'
              showSendButton={false}
              mode='incoming'
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={handleClose}
          variant='contained'
          disabled={!selectedConversationId}
          startIcon={<SendIcon />}
        >
          Send Reply
        </Button>
      </DialogActions>
    </Dialog>
  );
};
