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
  TextField,
  Typography,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { Store, Convo } from '../../utils/db';
import { fmtDate, sortConversationsByPriority } from '../../utils/db';
import { Badge } from '../common/Badge';

export interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
  processId: number;
  onSendReply: (conversationId: string, message: string) => void;
}

export const ReplyModal = ({
  open,
  onClose,
  store,
  processId,
  onSendReply,
}: ReplyModalProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<string>('');

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

  // Get the firm email from the selected conversation's messages
  const getFirmEmailFromConversation = (convo: Convo): string => {
    // Look for incoming messages to find the firm's email address
    for (const msg of convo.messages) {
      if (msg.direction === 'IN' && msg.fromRole !== 'OPS') {
        // Extract email from "Name <email>" format or use as-is
        const emailMatch = msg.from.match(/<([^>]+)>/);
        return emailMatch ? emailMatch[1] : msg.from;
      }
    }
    // Fallback to a default firm email
    return 'admin@example.com';
  };

  const handleClose = () => {
    setSelectedConversationId('');
    setReplyMessage('');
    onClose();
  };

  const handleSendReply = () => {
    if (!selectedConversationId || !replyMessage.trim()) {
      return;
    }

    onSendReply(selectedConversationId, replyMessage.trim());

    // Clear form and close modal
    setSelectedConversationId('');
    setReplyMessage('');
    onClose();
  };

  const isSubmitDisabled = !selectedConversationId || !replyMessage.trim();

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

          {/* Selected Conversation Details */}
          {selectedConversation && (
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Conversation Details
              </Typography>
              <Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {selectedConversation.state === 'PENDING_FUND' && (
                  <Badge text='pending fund reply' tone='blue' />
                )}
                {selectedConversation.state === 'PENDING_ARCH' && (
                  <Badge text='arch response needed' tone='amber' />
                )}
                {selectedConversation.state === 'CLOSED' && (
                  <Badge text='closed' tone='gray' />
                )}
                {selectedConversation.participants
                  .filter((p) => p !== 'ADMIN')
                  .map((p) => (
                    <Badge key={p} text={p} />
                  ))}
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                <strong>From:</strong>{' '}
                {getFirmEmailFromConversation(selectedConversation)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>To:</strong> {selectedConversation.aliasEmail}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Investments:</strong> {selectedConversation.investmentRefs.length}{' '}
                linked
              </Typography>
            </Box>
          )}

          {/* Reply Message */}
          <TextField
            label='Reply Message'
            placeholder='Type your reply as the firm...'
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            fullWidth
            multiline
            rows={6}
            variant='outlined'
            disabled={!selectedConversationId}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />

          {selectedConversationId && (
            <Typography variant='caption' color='text.secondary'>
              This reply will be sent from the firm's email address to the Arch alias
              email. Press Ctrl+Enter to send quickly.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={handleSendReply}
          variant='contained'
          disabled={isSubmitDisabled}
          startIcon={<SendIcon />}
        >
          Send Reply
        </Button>
      </DialogActions>
    </Dialog>
  );
};
