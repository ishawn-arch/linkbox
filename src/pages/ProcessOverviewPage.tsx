import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Message as MessageIcon,
  TrendingUp as InvestmentIcon,
  Send as SendIcon,
  Edit as ComposeIcon,
  Add as AddIcon,
  Settings as ManageIcon,
  Remove as RemoveIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import type { DetailMode, ConvoState, EmailMsg, Convo } from '../utils/db';
import { fmtDate, randBase32, emailAliasForOps } from '../utils/db';
import { useDatabaseContext } from '../contexts/DatabaseContext';

// Component imports
import { Badge } from '../components/common/Badge';
import { StatusBadge } from '../components/common/StatusBadge';
import { MessageCard } from '../components/conversations/MessageCard';
import { SortableTableCell } from '../components/tables/SortableTableCell';
import { ReplyModal } from '../components/modals/ReplyModal';

// Utility imports
import {
  handleSort,
  sortInvestments,
  type SortColumn,
  type SortDirection,
} from '../utils/sorting';
import {
  calculateInvestmentCounts,
  getConversationInvestments,
  getUnassignedInvestments,
  filterInvestmentsByStatus,
} from '../utils/investments';

export const ProcessOverviewPage = () => {
  const { id: processIdParam } = useParams<{ id: string }>();
  const processId = processIdParam ? parseInt(processIdParam, 10) : null;
  const navigate = useNavigate();
  const { store, updateStore, isLoading } = useDatabaseContext();
  const [detailMode, setDetailMode] = useState<DetailMode>('CONVERSATIONS');
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [composeMessage, setComposeMessage] = useState<string>('');
  const [showCompose, setShowCompose] = useState<boolean>(false);
  const [showNewConvoModal, setShowNewConvoModal] = useState<boolean>(false);
  const [newConvoTo, setNewConvoTo] = useState<string>('');
  const [newConvoSubject, setNewConvoSubject] = useState<string>('');
  const [newConvoBody, setNewConvoBody] = useState<string>('');
  const [selectedInvestments, setSelectedInvestments] = useState<number[]>([]);
  const [showEditInvestmentsModal, setShowEditInvestmentsModal] =
    useState<boolean>(false);
  const [editingInvestments, setEditingInvestments] = useState<number[]>([]);
  const [showAddInvestmentsModal, setShowAddInvestmentsModal] = useState<boolean>(false);
  const [addingInvestments, setAddingInvestments] = useState<number[]>([]);
  const [showRemoveInvestmentsModal, setShowRemoveInvestmentsModal] =
    useState<boolean>(false);
  const [removingInvestments, setRemovingInvestments] = useState<number[]>([]);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);

  if (isLoading || !store || processId === null) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          Loading process details...
        </Typography>
      </Container>
    );
  }

  const selectedProcess = store.processes[processId];
  if (!selectedProcess) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Typography variant='body1' color='error'>
          Process not found
        </Typography>
      </Container>
    );
  }

  const clientName = store.clients[selectedProcess.clientId].name;
  const processConvos = selectedProcess.convoIds.map((id) => store.convos[id]);
  const processInvestments = selectedProcess.investmentIds.map(
    (id) => store.investments[id],
  );

  function handleSortColumn(column: SortColumn) {
    const newSortState = handleSort(sortColumn, sortDirection, column);
    setSortColumn(newSortState.column);
    setSortDirection(newSortState.direction);
  }

  function stateBadge(state: ConvoState) {
    switch (state) {
      case 'NO_RESPONSE':
        return <Badge text='no response' tone='gray' />;
      case 'PENDING_FUND':
        return <Badge text='pending fund reply' tone='blue' />;
      case 'PENDING_ARCH':
        return <Badge text='arch response needed' tone='amber' />;
      case 'CLOSED':
        return (
          <Stack direction='row' spacing={0.5}>
            <Badge text='closed' tone='gray' />
            <Badge text='no response' tone='gray' />
          </Stack>
        );
      default:
        return null;
    }
  }

  // Calculate counts for the current view
  const conversationInvestments = getConversationInvestments(
    processInvestments,
    selectedConvoId,
    store,
  );
  const counts = calculateInvestmentCounts(conversationInvestments);

  function handleStatusFilterToggle(status: string) {
    setSelectedStatusFilter(selectedStatusFilter === status ? null : status);
  }

  function handleSendMessage() {
    if (!selectedConvoId || !composeMessage.trim() || !store) {
      return;
    }

    const selectedConvo = store.convos[selectedConvoId];

    // Find the firm email from existing messages (look for non-Arch emails)
    let firmEmail = 'admin@example.com'; // fallback
    for (const msg of selectedConvo.messages) {
      if (msg.fromRole !== 'OPS' && msg.direction === 'IN') {
        // Extract email from "Name <email>" format or use as-is
        const emailMatch = msg.from.match(/<([^>]+)>/);
        firmEmail = emailMatch ? emailMatch[1] : msg.from;
        break;
      }
    }

    const newMessage: EmailMsg = {
      id: `m_${Date.now()}`,
      ts: new Date().toISOString(),
      from: `Arch <${selectedConvo.aliasEmail}>`,
      fromRole: 'OPS',
      to: [firmEmail],
      direction: 'OUT',
      body: composeMessage.trim(),
    };

    // Update the store with the new message
    const updatedConvo = {
      ...selectedConvo,
      messages: [...selectedConvo.messages, newMessage],
      lastActivityAt: new Date().toISOString(),
      messageCount: selectedConvo.messageCount + 1,
      state: 'PENDING_FUND' as const, // Set to pending fund reply after Arch responds
    };

    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [selectedConvoId]: updatedConvo,
      },
    };

    updateStore(updatedStore);
    setComposeMessage('');
    setShowCompose(false); // Hide compose after sending
  }

  function handleCreateNewConversation() {
    if (
      !newConvoTo.trim() ||
      !newConvoSubject.trim() ||
      !newConvoBody.trim() ||
      !store ||
      !processId
    ) {
      return;
    }

    const selectedProcess = store.processes[processId];
    const ops = Object.values(store.ops)[0]; // Get the first ops member
    const aliasEmail = emailAliasForOps(ops);

    const newConvoId = `cv_${processId}_${randBase32(8)}`;
    const newMessageId = `m_${Date.now()}`;
    const now = new Date().toISOString();

    const newMessage: EmailMsg = {
      id: newMessageId,
      ts: now,
      from: `Arch <${aliasEmail}>`,
      fromRole: 'OPS',
      to: [newConvoTo.trim()],
      direction: 'OUT',
      body: newConvoBody.trim(),
    };

    const newConversation: Convo = {
      id: newConvoId,
      processId: processId,
      aliasEmail: aliasEmail,
      subject: newConvoSubject.trim(),
      participants: ['ADMIN'],
      investmentRefs: selectedInvestments,
      messageCount: 1,
      lastActivityAt: now,
      preview:
        newConvoBody.trim().substring(0, 100) +
        (newConvoBody.trim().length > 100 ? '...' : ''),
      state: 'PENDING_FUND',
      messages: [newMessage],
    };

    // Update the store with the new conversation
    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [newConvoId]: newConversation,
      },
      processes: {
        ...store.processes,
        [processId]: {
          ...selectedProcess,
          convoIds: [...selectedProcess.convoIds, newConvoId],
          lastActivityAt: now,
        },
      },
    };

    updateStore(updatedStore);

    // Clear the form and close modal
    setNewConvoTo('');
    setNewConvoSubject('');
    setNewConvoBody('');
    setSelectedInvestments([]);
    setShowNewConvoModal(false);

    // Select the new conversation
    setSelectedConvoId(newConvoId);
  }

  function handleEditInvestments() {
    if (!selectedConvoId || !store) return;

    const selectedConvo = store.convos[selectedConvoId];
    setEditingInvestments(selectedConvo.investmentRefs);
    setShowEditInvestmentsModal(true);
  }

  function handleSaveInvestmentChanges() {
    if (!selectedConvoId || !store) return;

    const selectedConvo = store.convos[selectedConvoId];
    const updatedConvo = {
      ...selectedConvo,
      investmentRefs: editingInvestments,
    };

    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [selectedConvoId]: updatedConvo,
      },
    };

    updateStore(updatedStore);
    setShowEditInvestmentsModal(false);
    setEditingInvestments([]);
  }

  function getUnassignedInvestmentsForProcess() {
    if (!store || !processId) return [];

    const selectedProcess = store.processes[processId];
    return getUnassignedInvestments(store, selectedProcess.clientId);
  }

  function handleAddInvestments() {
    setAddingInvestments([]);
    setShowAddInvestmentsModal(true);
  }

  function handleSaveAddedInvestments() {
    if (!processId || !store || addingInvestments.length === 0) return;

    const selectedProcess = store.processes[processId];

    // Update the investments to assign them to this process
    const updatedInvestments = { ...store.investments };
    addingInvestments.forEach((invId) => {
      if (updatedInvestments[invId]) {
        updatedInvestments[invId] = {
          ...updatedInvestments[invId],
          firmProcessId: processId,
          status: 'in_progress', // Default status when adding to process
        };
      }
    });

    // Update the process to include the new investments
    const updatedProcess = {
      ...selectedProcess,
      investmentIds: [...selectedProcess.investmentIds, ...addingInvestments],
    };

    const updatedStore = {
      ...store,
      investments: updatedInvestments,
      processes: {
        ...store.processes,
        [processId]: updatedProcess,
      },
    };

    updateStore(updatedStore);
    setShowAddInvestmentsModal(false);
    setAddingInvestments([]);
  }

  function handleRemoveInvestments() {
    setRemovingInvestments([]);
    setShowRemoveInvestmentsModal(true);
  }

  function handleSaveRemovedInvestments() {
    if (!processId || !store || removingInvestments.length === 0) return;

    const selectedProcess = store.processes[processId];

    // Update the investments to unassign them from this process
    const updatedInvestments = { ...store.investments };
    removingInvestments.forEach((invId) => {
      if (updatedInvestments[invId]) {
        updatedInvestments[invId] = {
          ...updatedInvestments[invId],
          firmProcessId: null,
          status: null, // Remove status when removing from process
        };
      }
    });

    // Update the process to remove the investments
    const updatedProcess = {
      ...selectedProcess,
      investmentIds: selectedProcess.investmentIds.filter(
        (invId) => !removingInvestments.includes(invId),
      ),
    };

    // Update all conversations in this process to remove references to these investments
    const updatedConvos = { ...store.convos };
    selectedProcess.convoIds.forEach((convoId) => {
      const convo = updatedConvos[convoId];
      if (convo) {
        updatedConvos[convoId] = {
          ...convo,
          investmentRefs: convo.investmentRefs.filter(
            (invId) => !removingInvestments.includes(invId),
          ),
        };
      }
    });

    const updatedStore = {
      ...store,
      investments: updatedInvestments,
      processes: {
        ...store.processes,
        [processId]: updatedProcess,
      },
      convos: updatedConvos,
    };

    updateStore(updatedStore);
    setShowRemoveInvestmentsModal(false);
    setRemovingInvestments([]);
  }

  function handleStatusChange(
    investmentId: number,
    newStatus: 'linked' | 'in_progress' | 'archived',
  ) {
    if (!store) return;

    const updatedInvestments = {
      ...store.investments,
      [investmentId]: {
        ...store.investments[investmentId],
        status: newStatus,
      },
    };

    const updatedStore = {
      ...store,
      investments: updatedInvestments,
    };

    updateStore(updatedStore);
  }

  function getFilteredInvestments() {
    const filtered = filterInvestmentsByStatus(
      conversationInvestments,
      selectedStatusFilter,
    );
    return sortInvestments(filtered, sortColumn, sortDirection);
  }

  function handleSendFirmReply(conversationId: string, message: string) {
    if (!store) return;

    const selectedConvo = store.convos[conversationId];
    if (!selectedConvo) return;

    // Get the firm email from existing messages (look for incoming messages)
    let firmEmail = 'admin@example.com'; // fallback
    for (const msg of selectedConvo.messages) {
      if (msg.direction === 'IN' && msg.fromRole !== 'OPS') {
        // Extract email from "Name <email>" format or use as-is
        const emailMatch = msg.from.match(/<([^>]+)>/);
        firmEmail = emailMatch ? emailMatch[1] : msg.from;
        break;
      }
    }

    const newMessage: EmailMsg = {
      id: `m_${Date.now()}`,
      ts: new Date().toISOString(),
      from: firmEmail, // Send from firm's email
      fromRole: 'ADMIN', // This is a firm admin reply
      to: [selectedConvo.aliasEmail],
      direction: 'IN', // This is incoming to Arch (from firm's perspective)
      body: message,
    };

    // Update the store with the new message
    const updatedConvo = {
      ...selectedConvo,
      messages: [...selectedConvo.messages, newMessage],
      lastActivityAt: new Date().toISOString(),
      messageCount: selectedConvo.messageCount + 1,
      state: 'PENDING_ARCH' as const, // Set state to indicate Arch needs to respond
    };

    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [conversationId]: updatedConvo,
      },
    };

    updateStore(updatedStore);
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3, bgcolor: 'background.default' }}>
      {/* Floating Reply Button - positioned under theme and reset buttons */}
      <Tooltip title='Reply as firm' placement='right'>
        <IconButton
          onClick={() => setShowReplyModal(true)}
          sx={{
            position: 'fixed',
            top: 124,
            left: 16,
            zIndex: 9998, // Slightly lower than other buttons
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:focus': {
              bgcolor: 'primary.dark',
            },
          }}
          aria-label='Send firm reply'
        >
          <ReplyIcon />
        </IconButton>
      </Tooltip>

      {/* Top Bar */}
      <Box sx={{ mb: 3 }}>
        <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
          {/* Left: Back Button */}
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
            >
              Back to Processes
            </Button>
          </Box>

          {/* Center: Firm and Client Names */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant='h5' component='h1' fontWeight={600}>
              {selectedProcess.firmName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {clientName}
            </Typography>
          </Box>

          {/* Right: Conversations/Investments Toggle */}
          <Box sx={{ flex: '0 0 auto', ml: 'auto' }}>
            <Stack direction='row' spacing={0}>
              <Button
                variant={detailMode === 'CONVERSATIONS' ? 'contained' : 'outlined'}
                startIcon={<MessageIcon />}
                onClick={() => {
                  setDetailMode('CONVERSATIONS');
                  setSelectedConvoId(null);
                  setSelectedStatusFilter(null);
                }}
                sx={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 0,
                }}
              >
                Conversations
              </Button>
              <Button
                variant={detailMode === 'INVESTMENTS' ? 'contained' : 'outlined'}
                startIcon={<InvestmentIcon />}
                onClick={() => {
                  setDetailMode('INVESTMENTS');
                  setSelectedConvoId(null);
                  setSelectedStatusFilter(null);
                  setSortColumn(null);
                  setSortDirection(null);
                }}
                sx={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                Investments
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Content */}
      {detailMode === 'CONVERSATIONS' && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ width: { xs: '100%', md: '20%' } }}>
            <Card>
              <CardHeader
                title='Conversations'
                action={
                  <IconButton
                    onClick={() => setShowNewConvoModal(true)}
                    color={showNewConvoModal ? 'primary' : 'default'}
                    size='small'
                  >
                    <AddIcon />
                  </IconButton>
                }
                slotProps={{
                  title: { variant: 'h6' },
                }}
              />
              <Box
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              />
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                <List disablePadding>
                  {processConvos.map((cv) => (
                    <ListItem key={cv.id} disablePadding>
                      <ListItemButton
                        selected={selectedConvoId === cv.id}
                        onClick={() => {
                          const newConvoId = selectedConvoId === cv.id ? null : cv.id;
                          setSelectedConvoId(newConvoId);
                          // Clear status filter when selecting/deselecting conversation
                          if (newConvoId !== selectedConvoId) {
                            setSelectedStatusFilter(null);
                          }
                        }}
                        sx={{
                          opacity: cv.state === 'CLOSED' ? 0.6 : 1,
                          py: 1.5,
                        }}
                      >
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
                                {cv.subject}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ ml: 2, flexShrink: 0 }}
                              >
                                {fmtDate(cv.lastActivityAt)}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction='row'
                              spacing={0.5}
                              sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
                            >
                              {stateBadge(cv.state)}
                              {cv.participants.map((p) => (
                                <Badge key={p} text={p} />
                              ))}
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

          <Box sx={{ width: { xs: '100%', md: '55%' } }}>
            <Card>
              <CardHeader
                title='Conversation'
                subheader={
                  selectedConvoId
                    ? `Alias: ${store.convos[selectedConvoId].aliasEmail}`
                    : undefined
                }
                action={
                  selectedConvoId && (
                    <IconButton
                      onClick={() => setShowCompose(!showCompose)}
                      color={showCompose ? 'primary' : 'default'}
                      size='small'
                    >
                      <ComposeIcon />
                    </IconButton>
                  )
                }
                slotProps={{
                  title: { variant: 'h6' },
                  subheader: { variant: 'caption' },
                }}
              />
              {!selectedConvoId && (
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Pick a conversation to view details.
                  </Typography>
                </CardContent>
              )}
              {selectedConvoId && (
                <CardContent>
                  <Stack spacing={3}>
                    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {stateBadge(store.convos[selectedConvoId].state)}
                      {store.convos[selectedConvoId].participants.map((p) => (
                        <Badge key={p} text={p} />
                      ))}
                    </Stack>

                    {showCompose && (
                      <Box>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Reply
                        </Typography>
                        <Stack direction='row' spacing={1} alignItems='flex-end'>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder='Type your reply...'
                            value={composeMessage}
                            onChange={(e) => setComposeMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            variant='outlined'
                            size='small'
                          />
                          <IconButton
                            color='primary'
                            onClick={handleSendMessage}
                            disabled={!composeMessage.trim()}
                            sx={{ mb: 0.5 }}
                          >
                            <SendIcon />
                          </IconButton>
                        </Stack>
                      </Box>
                    )}

                    <Box>
                      <Typography variant='body2' color='text.secondary' gutterBottom>
                        Emails
                      </Typography>
                      <Stack spacing={2}>
                        {store.convos[selectedConvoId].messages
                          .slice()
                          .sort(
                            (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
                          )
                          .map((m) => (
                            <MessageCard key={m.id} msg={m} />
                          ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              )}
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '25%' } }}>
            <Card>
              <CardHeader
                title={
                  selectedConvoId && store
                    ? `Investments (${conversationInvestments.length} in conversation)`
                    : `Investments (${processInvestments.length} total)`
                }
                action={
                  selectedConvoId ? (
                    <IconButton
                      onClick={handleEditInvestments}
                      color='default'
                      size='small'
                      title='Manage investments in this conversation'
                    >
                      <ManageIcon />
                    </IconButton>
                  ) : (
                    <Stack direction='row' spacing={0.5}>
                      <IconButton
                        onClick={handleAddInvestments}
                        color='default'
                        size='small'
                        title='Add investments to this process'
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        onClick={handleRemoveInvestments}
                        color='default'
                        size='small'
                        title='Remove investments from this process'
                        disabled={processInvestments.length === 0}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Stack>
                  )
                }
                slotProps={{
                  title: { variant: 'h6' },
                }}
              />
              <Box sx={{ px: 2, pb: 2 }}>
                <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Badge
                    text={`${counts.inProgress} in progress`}
                    tone='amber'
                    selected={selectedStatusFilter === 'in_progress'}
                    onClick={() => handleStatusFilterToggle('in_progress')}
                  />
                  <Badge
                    text={`${counts.linked} linked`}
                    tone='green'
                    selected={selectedStatusFilter === 'linked'}
                    onClick={() => handleStatusFilterToggle('linked')}
                  />
                  <Badge
                    text={`${counts.archived} archived`}
                    tone='gray'
                    selected={selectedStatusFilter === 'archived'}
                    onClick={() => handleStatusFilterToggle('archived')}
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
                  {getFilteredInvestments().map((inv) => (
                    <ListItem key={inv.id} disablePadding>
                      <ListItemButton sx={{ py: 1 }}>
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
                                  onStatusChange={handleStatusChange}
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
      )}

      {detailMode === 'INVESTMENTS' && (
        <Card>
          <CardHeader
            title={`Investments — ${selectedProcess.firmName}`}
            slotProps={{
              title: { variant: 'h6' },
            }}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <SortableTableCell
                    column='id'
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSortColumn}
                  >
                    ID
                  </SortableTableCell>
                  <SortableTableCell
                    column='entity'
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSortColumn}
                  >
                    Entity
                  </SortableTableCell>
                  <SortableTableCell
                    column='fund'
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSortColumn}
                  >
                    Fund
                  </SortableTableCell>
                  <SortableTableCell
                    column='status'
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSortColumn}
                  >
                    Status
                  </SortableTableCell>
                  <SortableTableCell
                    column='lastActivity'
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSortColumn}
                  >
                    Last Activity
                  </SortableTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredInvestments().map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontFamily='monospace'>
                        #{inv.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{inv.investingEntity}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{inv.fundName}</Typography>
                    </TableCell>
                    <TableCell>
                      {inv.status ? (
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
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          No Status
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {fmtDate(inv.lastActivityAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* New Conversation Modal */}
      <Dialog
        open={showNewConvoModal}
        onClose={() => {
          setNewConvoTo('');
          setNewConvoSubject('');
          setNewConvoBody('');
          setSelectedInvestments([]);
          setShowNewConvoModal(false);
        }}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <Stack direction='row' spacing={3} sx={{ mt: 1, height: '500px' }}>
            {/* Left side - Form */}
            <Box sx={{ flex: '1', minWidth: '300px' }}>
              <Stack spacing={2}>
                <TextField
                  label='To'
                  placeholder='admin@example.com'
                  value={newConvoTo}
                  onChange={(e) => setNewConvoTo(e.target.value)}
                  fullWidth
                  variant='outlined'
                  size='small'
                />
                <TextField
                  label='Subject'
                  placeholder='Enter subject line'
                  value={newConvoSubject}
                  onChange={(e) => setNewConvoSubject(e.target.value)}
                  fullWidth
                  variant='outlined'
                  size='small'
                />
                <TextField
                  label='Body'
                  placeholder='Type your message...'
                  value={newConvoBody}
                  onChange={(e) => setNewConvoBody(e.target.value)}
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
                            onDelete={() =>
                              setSelectedInvestments(
                                selectedInvestments.filter((id) => id !== investmentId),
                              )
                            }
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
                    {sortInvestments(processInvestments, null, null).map((inv) => (
                      <ListItem key={inv.id} disablePadding>
                        <ListItemButton
                          selected={selectedInvestments.includes(inv.id)}
                          onClick={() => {
                            if (selectedInvestments.includes(inv.id)) {
                              setSelectedInvestments(
                                selectedInvestments.filter((id) => id !== inv.id),
                              );
                            } else {
                              setSelectedInvestments([...selectedInvestments, inv.id]);
                            }
                          }}
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
          <Button
            onClick={() => {
              setNewConvoTo('');
              setNewConvoSubject('');
              setNewConvoBody('');
              setSelectedInvestments([]);
              setShowNewConvoModal(false);
            }}
            color='inherit'
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewConversation}
            variant='contained'
            disabled={
              !newConvoTo.trim() || !newConvoSubject.trim() || !newConvoBody.trim()
            }
            startIcon={<SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Investments Modal */}
      <Dialog
        open={showEditInvestmentsModal}
        onClose={() => {
          setEditingInvestments([]);
          setShowEditInvestmentsModal(false);
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Manage Investments
          {selectedConvoId && store && (
            <Typography variant='caption' color='text.secondary' display='block'>
              {store.convos[selectedConvoId].subject}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title='Select Investments'
                subheader={`${editingInvestments.length} of ${processInvestments.length} selected`}
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
                  {sortInvestments(processInvestments, null, null).map((inv) => (
                    <ListItem key={inv.id} disablePadding>
                      <ListItemButton
                        selected={editingInvestments.includes(inv.id)}
                        onClick={() => {
                          if (editingInvestments.includes(inv.id)) {
                            setEditingInvestments(
                              editingInvestments.filter((id) => id !== inv.id),
                            );
                          } else {
                            setEditingInvestments([...editingInvestments, inv.id]);
                          }
                        }}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={editingInvestments.includes(inv.id)}
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
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingInvestments([]);
              setShowEditInvestmentsModal(false);
            }}
            color='inherit'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveInvestmentChanges}
            variant='contained'
            startIcon={<ManageIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Investments Modal */}
      <Dialog
        open={showAddInvestmentsModal}
        onClose={() => {
          setAddingInvestments([]);
          setShowAddInvestmentsModal(false);
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Add Investments to Process
          <Typography variant='caption' color='text.secondary' display='block'>
            {selectedProcess.firmName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {getUnassignedInvestmentsForProcess().length === 0 ? (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ py: 4, textAlign: 'center' }}
              >
                No unassigned investments available for this client.
              </Typography>
            ) : (
              <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title='Available Investments'
                  subheader={`${addingInvestments.length} of ${
                    getUnassignedInvestmentsForProcess().length
                  } selected`}
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
                    {sortInvestments(
                      getUnassignedInvestmentsForProcess(),
                      'id',
                      'asc',
                    ).map((inv) => (
                      <ListItem key={inv.id} disablePadding>
                        <ListItemButton
                          selected={addingInvestments.includes(inv.id)}
                          onClick={() => {
                            if (addingInvestments.includes(inv.id)) {
                              setAddingInvestments(
                                addingInvestments.filter((id) => id !== inv.id),
                              );
                            } else {
                              setAddingInvestments([...addingInvestments, inv.id]);
                            }
                          }}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={addingInvestments.includes(inv.id)}
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
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddingInvestments([]);
              setShowAddInvestmentsModal(false);
            }}
            color='inherit'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAddedInvestments}
            variant='contained'
            disabled={addingInvestments.length === 0}
            startIcon={<AddIcon />}
          >
            Add Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Investments Modal */}
      <Dialog
        open={showRemoveInvestmentsModal}
        onClose={() => {
          setRemovingInvestments([]);
          setShowRemoveInvestmentsModal(false);
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Remove Investments from Process
          <Typography variant='caption' color='text.secondary' display='block'>
            {selectedProcess.firmName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {processInvestments.length === 0 ? (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ py: 4, textAlign: 'center' }}
              >
                No investments in this process to remove.
              </Typography>
            ) : (
              <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title='Select Investments to Remove'
                  subheader={`${removingInvestments.length} of ${processInvestments.length} selected`}
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
                    {sortInvestments(processInvestments, null, null).map((inv) => (
                      <ListItem key={inv.id} disablePadding>
                        <ListItemButton
                          selected={removingInvestments.includes(inv.id)}
                          onClick={() => {
                            if (removingInvestments.includes(inv.id)) {
                              setRemovingInvestments(
                                removingInvestments.filter((id) => id !== inv.id),
                              );
                            } else {
                              setRemovingInvestments([...removingInvestments, inv.id]);
                            }
                          }}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={removingInvestments.includes(inv.id)}
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
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRemovingInvestments([]);
              setShowRemoveInvestmentsModal(false);
            }}
            color='inherit'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRemovedInvestments}
            variant='contained'
            color='error'
            disabled={removingInvestments.length === 0}
            startIcon={<RemoveIcon />}
          >
            Remove Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Modal */}
      <ReplyModal
        open={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        store={store}
        processId={processId || 0}
        onSendReply={handleSendFirmReply}
      />
    </Container>
  );
};
