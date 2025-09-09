import { useNavigate } from 'react-router';
import {
  Box,
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
import type { Store } from '../utils/db';
import { ChevronRight } from '@mui/icons-material';
import { useDatabaseContext } from '../contexts/DatabaseContext';

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
    const invs = store.processes[processId].investmentIds.map(
      (id) => store.investments[id],
    );
    const total = invs.length;
    const linked = invs.filter((i) => i.status === 'linked').length;
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
              <TableCell>Firm</TableCell>
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
                      {p.firmName}
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
  const { store, isLoading } = useDatabaseContext();

  if (isLoading || !store) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          Loading processes...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3, bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' component='h1' gutterBottom fontWeight={600}>
            Linking Processes
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage your linking processes and track investment progress
          </Typography>
        </Box>
        <ProcessTable store={store} />
      </Stack>
    </Container>
  );
};
