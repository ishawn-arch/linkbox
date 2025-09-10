import { useNavigate } from 'react-router';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
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
} from '@mui/material';
import type { Store, FundProcess, Client, Convo, EmailMsg } from '../utils/db';
import { ChevronRight, Add } from '@mui/icons-material';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { getProcessInvestments } from '../utils/investments';
import { NewProcessModal } from '../components/modals/NewProcessModal';
import { emailAliasForOps, randBase32 } from '../utils/db';

/****************************** COMPONENTS ******************************/
function ProgressPill({ linked, total }: { linked: number; total: number }) {
  return (
    <Chip
      label={`${linked}/${total} linked`}
      color={linked === total ? 'success' : 'default'}
      size='small'
      sx={{ fontSize: '11px' }}
    />
  );
}

export const ProcessTable = ({ store }: { store: Store }) => {
  const navigate = useNavigate();
  const processes = Object.values(store.processes);

  function processCounts(processId: number) {
    const invs = getProcessInvestments(store, processId);
    // Exclude archived investments from the total count
    const activeInvs = invs.filter((i) => i.status !== 'archived');
    const total = activeInvs.length;
    const linked = activeInvs.filter((i) => i.status === 'linked').length;
    const unlinked = total - linked;
    return { total, linked, unlinked };
  }

  const clientName = (processId: number) =>
    store.clients[store.processes[processId].clientId].name;

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fund</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell># Convos</TableCell>
              <TableCell>Rounds</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processes.map((p) => {
              const counts = processCounts(p.id);
              return (
                <TableRow
                  key={p.id}
                  hover
                  onClick={() => navigate(`/${p.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      {p.fundName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {clientName(p.id)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ProgressPill linked={counts.linked} total={counts.total} />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{p.convoIds.length}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{p.roundIds.length}</Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <ChevronRight />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export const ProcessListPage = () => {
  const { store, isLoading, updateStore } = useDatabaseContext();
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);

  // New Process Modal State
  const [fundName, setFundName] = useState('');
  const [clientName, setClientName] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedInvestments, setSelectedInvestments] = useState<number[]>([]);

  if (isLoading || !store) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          Loading processes...
        </Typography>
      </Container>
    );
  }

  // Get unassigned investments (those not linked to any conversation)
  const availableInvestments = Object.values(store.investments).filter(
    (inv) => inv.status === null,
  );

  const generateNewProcessId = (): number => {
    const existingIds = Object.keys(store.processes).map(Number);
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  };

  const generateNewClientId = (): string => {
    const existingIds = Object.keys(store.clients);
    const clientNumbers = existingIds
      .map((id) => id.match(/^c(\d+)$/))
      .filter((match) => match)
      .map((match) => parseInt(match![1]));
    const nextNumber = clientNumbers.length > 0 ? Math.max(...clientNumbers) + 1 : 1;
    return `c${nextNumber}`;
  };

  // Handle email send from EmailComposer
  const handleEmailSend = (
    to: string,
    _cc: string[],
    _bcc: string[],
    message: string,
    subject?: string,
  ) => {
    // Create the process with the email details
    createProcessWithEmail(to, message, subject || '');
  };

  const createProcessWithEmail = (to: string, body: string, emailSubject: string) => {
    if (!store) return;

    const now = new Date().toISOString();
    const ops = Object.values(store.ops)[0]; // Get the first ops member
    const aliasEmail = emailAliasForOps(ops);

    // Create new client
    const clientId = generateNewClientId();
    const newClient: Client = {
      id: clientId,
      name: clientName.trim(),
      opsOwnerId: ops.id,
    };
    const updatedClients = { ...store.clients, [clientId]: newClient };

    // Create new process
    const processId = generateNewProcessId();
    const newConvoId = `cv_${processId}_${randBase32(8)}`;

    const newProcess: FundProcess = {
      id: processId,
      fundName: fundName.trim(),
      clientId,
      convoIds: [newConvoId],
      roundIds: [],
      createdAt: now,
      lastActivityAt: now,
    };

    // Create initial conversation and message
    const newMessageId = `m_${Date.now()}`;
    const newMessage: EmailMsg = {
      id: newMessageId,
      ts: now,
      from: `Arch <${aliasEmail}>`,
      fromRole: 'OPS',
      to: [to.trim()],
      direction: 'OUT',
      body: body.trim(),
    };

    const newConversation: Convo = {
      id: newConvoId,
      processId: processId,
      aliasEmail: aliasEmail,
      subject: emailSubject.trim(),
      participants: ['ADMIN'],
      investmentRefs: selectedInvestments,
      messageCount: 1,
      lastActivityAt: now,
      preview: body.trim().substring(0, 100) + (body.trim().length > 100 ? '...' : ''),
      state: 'PENDING_FUND',
      messages: [newMessage],
    };

    // Update selected investments to have in_progress status and be linked to the process
    const updatedInvestments = { ...store.investments };
    selectedInvestments.forEach((invId) => {
      if (updatedInvestments[invId]) {
        updatedInvestments[invId] = {
          ...updatedInvestments[invId],
          status: 'in_progress',
          lastActivityAt: now,
        };
      }
    });

    // Update the store
    const updatedStore: Store = {
      ...store,
      clients: updatedClients,
      processes: {
        ...store.processes,
        [processId]: newProcess,
      },
      convos: {
        ...store.convos,
        [newConvoId]: newConversation,
      },
      investments: updatedInvestments,
    };

    updateStore(updatedStore);

    // Clear form and close modal
    setFundName('');
    setClientName('');
    setSubject('');
    setSelectedInvestments([]);
    setShowNewProcessModal(false);
  };

  return (
    <Container maxWidth='xl' sx={{ py: 3, bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
          <Box>
            <Typography variant='h4' component='h1' gutterBottom fontWeight={600}>
              Linking Processes
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Manage your linking processes and track investment progress
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            sx={{ mt: 1 }}
            onClick={() => setShowNewProcessModal(true)}
          >
            Create New Process
          </Button>
        </Stack>
        <ProcessTable store={store} />
      </Stack>

      <NewProcessModal
        open={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        onSubmit={() => {}} // Not used anymore
        fundName={fundName}
        onFundNameChange={setFundName}
        clientName={clientName}
        onClientNameChange={setClientName}
        selectedInvestments={selectedInvestments}
        onSelectedInvestmentsChange={setSelectedInvestments}
        availableInvestments={availableInvestments}
        store={store}
        onEmailSend={handleEmailSend}
        subject={subject}
        onSubjectChange={setSubject}
      />
    </Container>
  );
};
