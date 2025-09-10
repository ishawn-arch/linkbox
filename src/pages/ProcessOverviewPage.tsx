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
  SwapHoriz as MoveIcon,
} from '@mui/icons-material';
import type { DetailMode, ConvoState, EmailMsg, Convo } from '../utils/db';
import {
  fmtDate,
  randBase32,
  emailAliasForOps,
  getConversationState,
  sortConversationsByPriority,
} from '../utils/db';
import { useDatabaseContext } from '../contexts/DatabaseContext';

// Component imports
import { Badge } from '../components/common/Badge';
import { StatusBadge } from '../components/common/StatusBadge';
import { MessageCard } from '../components/conversations/MessageCard';
import { SortableTableCell } from '../components/tables/SortableTableCell';
import { MoveConversationModal } from '../components/modals/MoveConversationModal';

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
  getProcessInvestments,
  getInvestmentsNotInProcess,
  filterInvestmentsByStatus,
} from '../utils/investments';
import { EmailComposer } from '../components/common/EmailComposer';

// Utility function to get conversations for a specific investment
function getInvestmentConversations(
  processConvos: Convo[],
  investmentId: number | null,
): Convo[] {
  if (!investmentId) return [];
  return processConvos.filter((convo) => convo.investmentRefs.includes(investmentId));
}

export const ProcessOverviewPage = () => {
  const { id: processIdParam } = useParams<{ id: string }>();
  const processId = processIdParam ? parseInt(processIdParam, 10) : null;
  const navigate = useNavigate();
  const { store, updateStore, isLoading } = useDatabaseContext();
  const [detailMode, setDetailMode] = useState<DetailMode>('CONVERSATIONS');
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showCompose, setShowCompose] = useState<boolean>(false);
  const [showNewConvoModal, setShowNewConvoModal] = useState<boolean>(false);
  const [newConvoTo, setNewConvoTo] = useState<string>('');
  const [newConvoSubject, setNewConvoSubject] = useState<string>('');
  const [newConvoBody, setNewConvoBody] = useState<string>('');
  const [selectedInvestments, setSelectedInvestments] = useState<number[]>([]);
  const [showEditInvestmentsModal, setShowEditInvestmentsModal] =
    useState<boolean>(false);
  const [editingInvestments, setEditingInvestments] = useState<number[]>([]);
  const [showMoveConversationModal, setShowMoveConversationModal] =
    useState<boolean>(false);

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
  const processConvos = sortConversationsByPriority(
    selectedProcess.convoIds.map((id) => store.convos[id]),
  );
  const processInvestments = getProcessInvestments(store, processId);

  function handleSortColumn(column: SortColumn) {
    const newSortState = handleSort(sortColumn, sortDirection, column);
    setSortColumn(newSortState.column);
    setSortDirection(newSortState.direction);
  }

  function stateBadge(state: ConvoState) {
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

  function handleSendMessage(
    to: string,
    cc: string[],
    bcc: string[],
    message: string,
    from?: string,
  ) {
    if (!selectedConvoId || !store) {
      return;
    }

    const selectedConvo = store.convos[selectedConvoId];

    const newMessage: EmailMsg = {
      id: `m_${Date.now()}`,
      ts: new Date().toISOString(),
      from: from || `Arch <${selectedConvo.aliasEmail}>`, // Use provided from or default to Arch
      fromRole: 'OPS',
      to: [to],
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      direction: 'OUT',
      body: message,
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

    // Update conversation state based on new investment assignments
    const newState = getConversationState(updatedConvo, store);
    const finalUpdatedConvo = {
      ...updatedConvo,
      state: newState,
    };

    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [selectedConvoId]: finalUpdatedConvo,
      },
    };

    updateStore(updatedStore);
    setShowEditInvestmentsModal(false);
    setEditingInvestments([]);
  }

  function getOtherInvestmentsForConversation() {
    if (!store || !processId) return [];

    const selectedProcess = store.processes[processId];
    return getInvestmentsNotInProcess(store, processId, selectedProcess.clientId);
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

    // Update conversation states based on new investment status
    const updatedConvos = { ...store.convos };
    Object.values(store.convos).forEach((convo) => {
      if (convo.investmentRefs.includes(investmentId)) {
        const tempStore = { ...store, investments: updatedInvestments };
        const newState = getConversationState(convo, tempStore);
        if (newState !== convo.state) {
          updatedConvos[convo.id] = {
            ...convo,
            state: newState,
          };
        }
      }
    });

    const updatedStore = {
      ...store,
      investments: updatedInvestments,
      convos: updatedConvos,
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

  function handleMoveConversations(conversationIds: string[], targetProcessId: number) {
    if (!store || !processId || conversationIds.length === 0) return;

    const currentProcess = store.processes[processId];
    const targetProcess = store.processes[targetProcessId];

    if (!currentProcess || !targetProcess) return;

    // Update conversations to have new process ID
    const updatedConvos = { ...store.convos };
    conversationIds.forEach((convoId) => {
      if (updatedConvos[convoId]) {
        updatedConvos[convoId] = {
          ...updatedConvos[convoId],
          processId: targetProcessId,
        };
      }
    });

    // Remove conversation IDs from current process
    const updatedCurrentProcess = {
      ...currentProcess,
      convoIds: currentProcess.convoIds.filter((id) => !conversationIds.includes(id)),
    };

    // Add conversation IDs to target process
    const updatedTargetProcess = {
      ...targetProcess,
      convoIds: [...targetProcess.convoIds, ...conversationIds],
      lastActivityAt: new Date().toISOString(), // Update last activity
    };

    const updatedStore = {
      ...store,
      convos: updatedConvos,
      processes: {
        ...store.processes,
        [processId]: updatedCurrentProcess,
        [targetProcessId]: updatedTargetProcess,
      },
    };

    updateStore(updatedStore);
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3, bgcolor: 'background.default' }}>
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

          {/* Center: Fund and Client Names */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant='h5' component='h1' fontWeight={600}>
              {selectedProcess.fundName}
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
                  setSelectedInvestmentId(null);
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
                  setSelectedInvestmentId(null);
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
                  <Stack direction='row' spacing={0.5}>
                    <Tooltip title='Move conversations to another process'>
                      <IconButton
                        onClick={() => setShowMoveConversationModal(true)}
                        color={showMoveConversationModal ? 'primary' : 'default'}
                        size='small'
                        disabled={processConvos.length === 0}
                      >
                        <MoveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Add new conversation'>
                      <IconButton
                        onClick={() => setShowNewConvoModal(true)}
                        color={showNewConvoModal ? 'primary' : 'default'}
                        size='small'
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
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
                    {showCompose && (
                      <Box>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Reply
                        </Typography>
                        <EmailComposer
                          conversation={
                            selectedConvoId ? store.convos[selectedConvoId] : null
                          }
                          onSend={handleSendMessage}
                          placeholder='Type your reply...'
                        />
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
                      color={showEditInvestmentsModal ? 'primary' : 'default'}
                      size='small'
                      title='Manage investments in this conversation'
                    >
                      <ManageIcon />
                    </IconButton>
                  ) : null
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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent='space-between'
        >
          <Box sx={{ width: { xs: '100%', md: '75%' } }}>
            <Card>
              <CardHeader
                title={`Investments — ${selectedProcess.fundName}`}
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
                      <TableRow
                        key={inv.id}
                        hover
                        selected={selectedInvestmentId === inv.id}
                        onClick={() => {
                          const newInvestmentId =
                            selectedInvestmentId === inv.id ? null : inv.id;
                          setSelectedInvestmentId(newInvestmentId);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
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
          </Box>

          <Box sx={{ width: { xs: '100%', md: '25%' } }}>
            <Card>
              <CardHeader
                title={
                  selectedInvestmentId
                    ? `Conversations for Investment #${selectedInvestmentId}`
                    : 'Conversations'
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
                {(() => {
                  if (!selectedInvestmentId) {
                    return (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>
                          Select an investment to view its conversations.
                        </Typography>
                      </Box>
                    );
                  }

                  const investmentConversations = getInvestmentConversations(
                    processConvos,
                    selectedInvestmentId,
                  );

                  if (investmentConversations.length === 0) {
                    return (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>
                          No conversations associated with this investment.
                        </Typography>
                      </Box>
                    );
                  }

                  return (
                    <List disablePadding>
                      {investmentConversations.map((convo) => (
                        <ListItem key={convo.id} disablePadding>
                          <ListItemButton
                            onClick={() => {
                              // Switch to conversations view and select this conversation
                              setDetailMode('CONVERSATIONS');
                              setSelectedConvoId(convo.id);
                              setSelectedInvestmentId(null);
                              setSelectedStatusFilter(null);
                            }}
                            sx={{
                              opacity: convo.state === 'CLOSED' ? 0.6 : 1,
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
                                <Stack
                                  direction='row'
                                  spacing={0.5}
                                  sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
                                >
                                  {stateBadge(convo.state)}
                                </Stack>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  );
                })()}
              </Box>
            </Card>
          </Box>
        </Stack>
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
        maxWidth='lg'
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
          <Stack direction='row' spacing={3} sx={{ mt: 1, height: '500px' }}>
            {/* Process Investments */}
            <Box sx={{ flex: '1', minWidth: '300px' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title='Process Investments'
                  subheader={`${
                    editingInvestments.filter((id) =>
                      processInvestments.some((inv) => inv.id === id),
                    ).length
                  } of ${processInvestments.length} selected`}
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

            {/* Other Investments */}
            <Box sx={{ flex: '1', minWidth: '300px' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title='Other Investments'
                  subheader={(() => {
                    const otherInvestments = getOtherInvestmentsForConversation();
                    const selectedOther = editingInvestments.filter((id) =>
                      otherInvestments.some((inv) => inv.id === id),
                    ).length;
                    return `${selectedOther} of ${otherInvestments.length} selected`;
                  })()}
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
                  {getOtherInvestmentsForConversation().length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>
                        No other investments available for this client.
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {sortInvestments(
                        getOtherInvestmentsForConversation(),
                        'id',
                        'asc',
                      ).map((inv) => (
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
                  )}
                </Box>
              </Card>
            </Box>
          </Stack>
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

      {/* Move Conversation Modal */}
      <MoveConversationModal
        open={showMoveConversationModal}
        onClose={() => setShowMoveConversationModal(false)}
        store={store}
        currentProcessId={processId || 0}
        onMoveConversations={handleMoveConversations}
      />
    </Container>
  );
};
