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
    subject?: string,
    from?: string,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  showSendButton?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  mode?: 'outgoing' | 'incoming'; // outgoing = To field (default), incoming = From field
  showSubject?: boolean;
  initialSubject?: string;
  onSubjectChange?: (subject: string) => void;
  // Controlled props for external state management
  controlledTo?: string;
  onToChange?: (to: string) => void;
  controlledMessage?: string;
  onMessageChange?: (message: string) => void;
  controlledCc?: string[];
  onCcChange?: (cc: string[]) => void;
  controlledBcc?: string[];
  onBccChange?: (bcc: string[]) => void;
}

export const EmailComposer = ({
  conversation,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  showSendButton = true,
  onKeyDown,
  mode = 'outgoing',
  showSubject = false,
  initialSubject = '',
  onSubjectChange,
  controlledTo,
  onToChange,
  controlledMessage,
  onMessageChange,
  controlledCc,
  onCcChange,
  controlledBcc,
  onBccChange,
}: EmailComposerProps) => {
  const [message, setMessage] = useState<string>(controlledMessage || '');
  const [subject, setSubject] = useState<string>(initialSubject);
  const [selectedToEmail, setSelectedToEmail] = useState<string>(controlledTo || '');
  const [selectedCcEmails, setSelectedCcEmails] = useState<string[]>(controlledCc || []);
  const [selectedBccEmails, setSelectedBccEmails] = useState<string[]>(
    controlledBcc || [],
  );
  const [hasUserInteractedWithTo, setHasUserInteractedWithTo] = useState<boolean>(false);

  // Use controlled values if provided
  const actualMessage = controlledMessage !== undefined ? controlledMessage : message;
  const actualSelectedToEmail =
    controlledTo !== undefined ? controlledTo : selectedToEmail;
  const actualSelectedCcEmails =
    controlledCc !== undefined ? controlledCc : selectedCcEmails;
  const actualSelectedBccEmails =
    controlledBcc !== undefined ? controlledBcc : selectedBccEmails;

  // Get email options for autocomplete
  const emailOptions = useMemo(() => {
    if (!conversation) return [];
    return createEmailAutocompleteOptions(conversation);
  }, [conversation]);

  // Get filtered options for primary field (excludes CC and BCC emails)
  const primaryEmailOptions = useMemo(() => {
    const excludedEmails = [...actualSelectedCcEmails, ...actualSelectedBccEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [emailOptions, actualSelectedCcEmails, actualSelectedBccEmails]);

  // Get filtered options for CC field (excludes primary, BCC, and already selected CC emails)
  const ccEmailOptions = useMemo(() => {
    const excludedEmails = actualSelectedToEmail
      ? [actualSelectedToEmail, ...actualSelectedBccEmails, ...actualSelectedCcEmails]
      : [...actualSelectedBccEmails, ...actualSelectedCcEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [
    emailOptions,
    actualSelectedToEmail,
    actualSelectedBccEmails,
    actualSelectedCcEmails,
  ]);

  // Get filtered options for BCC field (excludes primary, CC, and already selected BCC emails)
  const bccEmailOptions = useMemo(() => {
    const excludedEmails = actualSelectedToEmail
      ? [actualSelectedToEmail, ...actualSelectedCcEmails, ...actualSelectedBccEmails]
      : [...actualSelectedCcEmails, ...actualSelectedBccEmails];
    return emailOptions.filter((option) => !excludedEmails.includes(option.email));
  }, [
    emailOptions,
    actualSelectedToEmail,
    actualSelectedCcEmails,
    actualSelectedBccEmails,
  ]);

  // Auto-select the only email option if there's exactly one (only if user hasn't manually interacted)
  useEffect(() => {
    if (!hasUserInteractedWithTo && controlledTo === undefined) {
      if (primaryEmailOptions.length === 1 && !selectedToEmail) {
        setSelectedToEmail(primaryEmailOptions[0].email);
      } else if (primaryEmailOptions.length === 0) {
        setSelectedToEmail('');
      }
    }
  }, [primaryEmailOptions, selectedToEmail, hasUserInteractedWithTo, controlledTo]);

  // Reset email fields when conversation changes
  useEffect(() => {
    setSelectedToEmail('');
    setSelectedCcEmails([]);
    setSelectedBccEmails([]);
    setMessage('');
    setSubject(initialSubject);
    setHasUserInteractedWithTo(false);
  }, [conversation, initialSubject]);

  // Handle subject change callback
  useEffect(() => {
    if (onSubjectChange) {
      onSubjectChange(subject);
    }
  }, [subject, onSubjectChange]);

  const handleSend = () => {
    if (!actualSelectedToEmail || !actualMessage.trim()) {
      return;
    }

    if (isIncomingMode && conversation) {
      // For incoming mode: From field is selectedToEmail, To field is conversation.aliasEmail
      onSend(
        conversation.aliasEmail,
        actualSelectedCcEmails,
        actualSelectedBccEmails,
        actualMessage.trim(),
        showSubject ? subject.trim() : undefined,
        actualSelectedToEmail,
      );
    } else {
      // For outgoing mode: To field is selectedToEmail, From field is handled by parent
      onSend(
        actualSelectedToEmail,
        actualSelectedCcEmails,
        actualSelectedBccEmails,
        actualMessage.trim(),
        showSubject ? subject.trim() : undefined,
      );
    }

    // Clear form after sending (only if not controlled)
    if (controlledMessage === undefined) setMessage('');
    if (controlledTo === undefined) setSelectedToEmail('');
    if (controlledCc === undefined) setSelectedCcEmails([]);
    if (controlledBcc === undefined) setSelectedBccEmails([]);
    setSubject(initialSubject);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (actualSelectedToEmail && actualMessage.trim()) {
        handleSend();
      }
    }
  };

  const canSend = actualSelectedToEmail && actualMessage.trim();
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

      {/* Subject Field */}
      {showSubject && (
        <TextField
          label='Subject'
          placeholder='Enter subject line'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          variant='outlined'
          size='small'
          disabled={disabled}
          fullWidth
        />
      )}

      {/* Primary Email Selection (To for outgoing, From for incoming) */}
      <Autocomplete
        freeSolo
        value={actualSelectedToEmail}
        onChange={(_, newValue) => {
          setHasUserInteractedWithTo(true);
          const emailValue =
            typeof newValue === 'string' ? newValue : newValue?.email || '';
          if (controlledTo !== undefined && onToChange) {
            onToChange(emailValue);
          } else {
            setSelectedToEmail(emailValue);
          }
        }}
        onInputChange={(_, newInputValue) => {
          setHasUserInteractedWithTo(true);
          if (controlledTo !== undefined && onToChange) {
            onToChange(newInputValue);
          } else {
            setSelectedToEmail(newInputValue);
          }
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
        value={actualSelectedCcEmails}
        onChange={(_, newValue) => {
          const emails = newValue.map((val) => {
            if (typeof val === 'string') return val;
            return val.email;
          });
          // Remove duplicates within CC field
          const uniqueEmails = [...new Set(emails)];
          if (controlledCc !== undefined && onCcChange) {
            onCcChange(uniqueEmails);
          } else {
            setSelectedCcEmails(uniqueEmails);
          }
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
        value={actualSelectedBccEmails}
        onChange={(_, newValue) => {
          const emails = newValue.map((val) => {
            if (typeof val === 'string') return val;
            return val.email;
          });
          // Remove duplicates within BCC field
          const uniqueEmails = [...new Set(emails)];
          if (controlledBcc !== undefined && onBccChange) {
            onBccChange(uniqueEmails);
          } else {
            setSelectedBccEmails(uniqueEmails);
          }
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
          value={actualMessage}
          onChange={(e) => {
            const newMessage = e.target.value;
            if (controlledMessage !== undefined && onMessageChange) {
              onMessageChange(newMessage);
            } else {
              setMessage(newMessage);
            }
          }}
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
      {(actualSelectedToEmail ||
        actualSelectedCcEmails.length > 0 ||
        actualSelectedBccEmails.length > 0) && (
        <Box>
          <Typography variant='caption' color='text.secondary'>
            {isIncomingMode && actualSelectedToEmail && `From: ${actualSelectedToEmail}`}
            {isIncomingMode && conversation && ` • To: ${conversation.aliasEmail}`}
            {!isIncomingMode && actualSelectedToEmail && `To: ${actualSelectedToEmail}`}
            {actualSelectedCcEmails.length > 0 && (
              <span>
                {actualSelectedToEmail || (isIncomingMode && conversation) ? ' • ' : ''}
                CC: {actualSelectedCcEmails.join(', ')}
              </span>
            )}
            {actualSelectedBccEmails.length > 0 && (
              <span>
                {actualSelectedToEmail ||
                actualSelectedCcEmails.length > 0 ||
                (isIncomingMode && conversation)
                  ? ' • '
                  : ''}
                BCC: {actualSelectedBccEmails.join(', ')}
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
