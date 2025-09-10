import { useState } from 'react';
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
import { Add as AddIcon } from '@mui/icons-material';
import type { Store, Investment } from '../../utils/db';
import { Badge } from '../common/Badge';
import { sortInvestmentsByDefault } from '../../utils/investments';
import { EmailComposer } from '../common/EmailComposer';

export interface NewProcessModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  fundName: string;
  onFundNameChange: (value: string) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  selectedInvestments: number[];
  onSelectedInvestmentsChange: (investments: number[]) => void;
  availableInvestments: Investment[];
  store: Store | null;
  onEmailSend: (
    to: string,
    cc: string[],
    bcc: string[],
    message: string,
    subject?: string,
  ) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
}

export const NewProcessModal = ({
  open,
  onClose,
  onSubmit,
  fundName,
  onFundNameChange,
  clientName,
  onClientNameChange,
  selectedInvestments,
  onSelectedInvestmentsChange,
  availableInvestments,
  store,
  onEmailSend,
  subject,
  onSubjectChange,
}: NewProcessModalProps) => {
  // Local state for email data
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailCc, setEmailCc] = useState<string[]>([]);
  const [emailBcc, setEmailBcc] = useState<string[]>([]);
  const [emailMessage, setEmailMessage] = useState<string>('');

  const handleClose = () => {
    onFundNameChange('');
    onClientNameChange('');
    onSelectedInvestmentsChange([]);
    setEmailTo('');
    setEmailCc([]);
    setEmailBcc([]);
    setEmailMessage('');
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

  const handleSubmit = () => {
    if (emailTo.trim() && emailMessage.trim()) {
      onEmailSend(emailTo, emailCc, emailBcc, emailMessage, subject);
    }
  };

  const isSubmitDisabled =
    !fundName.trim() || !clientName.trim() || !emailTo.trim() || !emailMessage.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle>Create New Process</DialogTitle>
      <DialogContent>
        <Stack direction='row' spacing={3} sx={{ mt: 1, height: '600px' }}>
          {/* Left side - Form */}
          <Box sx={{ flex: '1', minWidth: '350px' }}>
            <Stack spacing={2}>
              <TextField
                label='Fund Name'
                placeholder='Enter fund name'
                value={fundName}
                onChange={(e) => onFundNameChange(e.target.value)}
                fullWidth
                variant='outlined'
                size='small'
              />

              <TextField
                label='Client Name'
                placeholder='Enter client name'
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                fullWidth
                variant='outlined'
                size='small'
              />

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Typography variant='subtitle2' gutterBottom color='text.secondary'>
                  Initial Conversation Details
                </Typography>

                <EmailComposer
                  conversation={null}
                  onSend={() => {}} // Not used since showSendButton is false
                  placeholder='Type your initial message...'
                  showSendButton={false}
                  showSubject={true}
                  initialSubject={subject}
                  onSubjectChange={onSubjectChange}
                  controlledTo={emailTo}
                  onToChange={setEmailTo}
                  controlledMessage={emailMessage}
                  onMessageChange={setEmailMessage}
                  controlledCc={emailCc}
                  onCcChange={setEmailCc}
                  controlledBcc={emailBcc}
                  onBccChange={setEmailBcc}
                />

                {selectedInvestments.length > 0 && (
                  <Box sx={{ mt: 2 }}>
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
              </Box>
            </Stack>
          </Box>

          {/* Right side - Investments Panel */}
          <Box sx={{ width: '300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title='Select Investments'
                subheader={`${selectedInvestments.length} of ${availableInvestments.length} selected`}
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
                  {sortInvestmentsByDefault(availableInvestments).map((inv) => (
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
          onClick={handleSubmit}
          variant='contained'
          disabled={isSubmitDisabled}
          startIcon={<AddIcon />}
        >
          Create Process & Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};
