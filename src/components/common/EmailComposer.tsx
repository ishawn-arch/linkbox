import { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { Convo } from '../../utils/db';
import { createEmailAutocompleteOptions } from '../../utils/emailUtils';

export interface EmailComposerProps {
  conversation: Convo | null;
  onSend: (
    to: string,
    cc: string[],
    bcc: string[],
    message: string,
    from?: string,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  showSendButton?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  mode?: 'outgoing' | 'incoming'; // outgoing = To field (default), incoming = From field
}

export const EmailComposer = ({
  conversation,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  showSendButton = true,
  onKeyDown,
  mode = 'outgoing',
}: EmailComposerProps) => {
  const [message, setMessage] = useState<string>('');
  const [selectedToEmail, setSelectedToEmail] = useState<string>('');
  const [selectedCcEmails, setSelectedCcEmails] = useState<string[]>([]);
  const [selectedBccEmails, setSelectedBccEmails] = useState<string[]>([]);
  const [hasUserInteractedWithTo, setHasUserInteractedWithTo] = useState<boolean>(false);

  // Get email options for autocomplete
  const emailOptions = useMemo(() => {
    if (!conversation) return [];
    return createEmailAutocompleteOptions(conversation);
  }, [conversation]);

  // Get filtered options for primary field (excludes CC and BCC emails)
  const primaryEmailOptions = useMemo(() => {
    const excludedEmails = [...selectedCcEmails, ...selectedBccEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [emailOptions, selectedCcEmails, selectedBccEmails]);

  // Get filtered options for CC field (excludes primary, BCC, and already selected CC emails)
  const ccEmailOptions = useMemo(() => {
    const excludedEmails = selectedToEmail
      ? [selectedToEmail, ...selectedBccEmails, ...selectedCcEmails]
      : [...selectedBccEmails, ...selectedCcEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [emailOptions, selectedToEmail, selectedBccEmails, selectedCcEmails]);

  // Get filtered options for BCC field (excludes primary, CC, and already selected BCC emails)
  const bccEmailOptions = useMemo(() => {
    const excludedEmails = selectedToEmail
      ? [selectedToEmail, ...selectedCcEmails, ...selectedBccEmails]
      : [...selectedCcEmails, ...selectedBccEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [emailOptions, selectedToEmail, selectedCcEmails, selectedBccEmails]);

  // Auto-select the only email option if there's exactly one (only if user hasn't manually interacted)
  useEffect(() => {
    if (!hasUserInteractedWithTo) {
      if (primaryEmailOptions.length === 1 && !selectedToEmail) {
        setSelectedToEmail(primaryEmailOptions[0].email);
      } else if (primaryEmailOptions.length === 0) {
        setSelectedToEmail('');
      }
    }
  }, [primaryEmailOptions, selectedToEmail, hasUserInteractedWithTo]);

  // Reset email fields when conversation changes
  useEffect(() => {
    setSelectedToEmail('');
    setSelectedCcEmails([]);
    setSelectedBccEmails([]);
    setMessage('');
    setHasUserInteractedWithTo(false);
  }, [conversation]);

  const handleSend = () => {
    if (!selectedToEmail || !message.trim()) {
      return;
    }

    if (isIncomingMode && conversation) {
      // For incoming mode: From field is selectedToEmail, To field is conversation.aliasEmail
      onSend(
        conversation.aliasEmail,
        selectedCcEmails,
        selectedBccEmails,
        message.trim(),
        selectedToEmail,
      );
    } else {
      // For outgoing mode: To field is selectedToEmail, From field is handled by parent
      onSend(selectedToEmail, selectedCcEmails, selectedBccEmails, message.trim());
    }

    // Clear form after sending
    setMessage('');
    setSelectedToEmail('');
    setSelectedCcEmails([]);
    setSelectedBccEmails([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (selectedToEmail && message.trim()) {
        handleSend();
      }
    }
  };

  const canSend = selectedToEmail && message.trim();
  const isIncomingMode = mode === 'incoming';
  const primaryFieldLabel = isIncomingMode ? 'From' : 'Send To';
  const primaryFieldPlaceholder = isIncomingMode
    ? primaryEmailOptions.length > 0
      ? 'Select firm email or enter address...'
      : 'Enter firm email address...'
    : primaryEmailOptions.length > 0
    ? 'Select from previous emails or enter new address...'
    : 'Enter recipient email address...';

  return (
    <Stack spacing={2}>
      {/* Fixed To Field for Incoming Mode */}
      {isIncomingMode && conversation && (
        <TextField
          label='Send To'
          value={conversation.aliasEmail}
          variant='outlined'
          size='small'
          disabled
          helperText='Arch alias email (fixed)'
        />
      )}

      {/* Primary Email Selection (To for outgoing, From for incoming) */}
      <Autocomplete
        freeSolo
        value={selectedToEmail}
        onChange={(_, newValue) => {
          setHasUserInteractedWithTo(true);
          if (typeof newValue === 'string') {
            setSelectedToEmail(newValue);
          } else if (newValue && typeof newValue === 'object') {
            setSelectedToEmail(newValue.email);
          }
        }}
        onInputChange={(_, newInputValue) => {
          setHasUserInteractedWithTo(true);
          setSelectedToEmail(newInputValue);
        }}
        options={primaryEmailOptions}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.email;
        }}
        isOptionEqualToValue={(option, value) => {
          if (typeof value === 'string') {
            if (typeof option === 'string') return option === value;
            if (option && 'email' in option) return option.email === value;
          }
          return false;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={primaryFieldLabel}
            placeholder={primaryFieldPlaceholder}
            variant='outlined'
            size='small'
            disabled={disabled}
          />
        )}
        renderOption={(
          props,
          option: {
            email: string;
            label: string;
            displayName: string;
          },
        ) => (
          <Box component='li' {...props}>
            <Box>
              <Typography variant='body2'>{option.displayName}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {option.email}
              </Typography>
            </Box>
          </Box>
        )}
        size='small'
        disabled={disabled}
      />

      {/* CC Field */}
      <Autocomplete
        freeSolo
        multiple
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        value={selectedCcEmails}
        onChange={(_, newValue) => {
          const emails = newValue.map((val) => {
            if (typeof val === 'string') return val;
            return val.email;
          });
          // Remove duplicates within CC field
          const uniqueEmails = [...new Set(emails)];
          setSelectedCcEmails(uniqueEmails);
        }}
        options={ccEmailOptions}
        filterOptions={(options, params) => {
          const { inputValue } = params;
          // Include all matching options
          const filtered = options.filter(
            (option) =>
              option.email.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.displayName.toLowerCase().includes(inputValue.toLowerCase()),
          );

          // If input has text and doesn't match exactly any existing option, allow it as a custom option
          if (
            inputValue !== '' &&
            !options.some((option) => option.email === inputValue)
          ) {
            filtered.push({
              email: inputValue,
              label: inputValue,
              displayName: inputValue,
            });
          }

          return filtered;
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.label;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label='CC (optional)'
            placeholder='Add CC recipients...'
            variant='outlined'
            size='small'
            disabled={disabled}
          />
        )}
        renderOption={(props, option) => (
          <Box component='li' {...props}>
            <Box>
              {typeof option === 'string' ? (
                <>
                  <Typography variant='body2'>{option}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Custom email address
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant='body2'>{option.displayName}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {option.email}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        )}
        size='small'
        disabled={disabled}
      />

      {/* BCC Field */}
      <Autocomplete
        freeSolo
        multiple
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        value={selectedBccEmails}
        onChange={(_, newValue) => {
          const emails = newValue.map((val) => {
            if (typeof val === 'string') return val;
            return val.email;
          });
          // Remove duplicates within BCC field
          const uniqueEmails = [...new Set(emails)];
          setSelectedBccEmails(uniqueEmails);
        }}
        options={bccEmailOptions}
        filterOptions={(options, params) => {
          const { inputValue } = params;
          // Include all matching options
          const filtered = options.filter(
            (option) =>
              option.email.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.displayName.toLowerCase().includes(inputValue.toLowerCase()),
          );

          // If input has text and doesn't match exactly any existing option, allow it as a custom option
          if (
            inputValue !== '' &&
            !options.some((option) => option.email === inputValue)
          ) {
            filtered.push({
              email: inputValue,
              label: inputValue,
              displayName: inputValue,
            });
          }

          return filtered;
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.label;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label='BCC (optional)'
            placeholder='Add BCC recipients...'
            variant='outlined'
            size='small'
            disabled={disabled}
          />
        )}
        renderOption={(props, option) => (
          <Box component='li' {...props}>
            <Box>
              {typeof option === 'string' ? (
                <>
                  <Typography variant='body2'>{option}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Custom email address
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant='body2'>{option.displayName}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {option.email}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        )}
        size='small'
        disabled={disabled}
      />

      {/* Message Field */}
      <Stack direction='row' spacing={1} alignItems='flex-end'>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          variant='outlined'
          size='small'
          disabled={disabled}
        />
        {showSendButton && (
          <IconButton
            color='primary'
            onClick={handleSend}
            disabled={!canSend || disabled}
            sx={{ mb: 0.5 }}
          >
            <SendIcon />
          </IconButton>
        )}
      </Stack>

      {/* Recipient Summary */}
      {(selectedToEmail ||
        selectedCcEmails.length > 0 ||
        selectedBccEmails.length > 0) && (
        <Box>
          <Typography variant='caption' color='text.secondary'>
            {isIncomingMode && selectedToEmail && `From: ${selectedToEmail}`}
            {isIncomingMode && conversation && ` • To: ${conversation.aliasEmail}`}
            {!isIncomingMode && selectedToEmail && `To: ${selectedToEmail}`}
            {selectedCcEmails.length > 0 && (
              <span>
                {selectedToEmail || (isIncomingMode && conversation) ? ' • ' : ''}CC:{' '}
                {selectedCcEmails.join(', ')}
              </span>
            )}
            {selectedBccEmails.length > 0 && (
              <span>
                {selectedToEmail ||
                selectedCcEmails.length > 0 ||
                (isIncomingMode && conversation)
                  ? ' • '
                  : ''}
                BCC: {selectedBccEmails.join(', ')}
              </span>
            )}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block', mt: 0.5 }}
          >
            Press Ctrl+Enter to send quickly.
          </Typography>
        </Box>
      )}
    </Stack>
  );
};
