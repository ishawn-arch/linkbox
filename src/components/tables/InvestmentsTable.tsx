import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Investment } from '../../utils/db';
import { fmtDate } from '../../utils/db';
import { Badge } from '../common/Badge';
import {
  SortableTableCell,
  type SortColumn,
  type SortDirection,
} from './SortableTableCell';
import { sortInvestments } from '../../utils/sorting';
import { filterInvestmentsByStatus } from '../../utils/investments';

export interface InvestmentsTableProps {
  title: string;
  investments: Investment[];
  statusFilter: string | null;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export const InvestmentsTable = ({
  title,
  investments,
  statusFilter,
  sortColumn,
  sortDirection,
  onSort,
}: InvestmentsTableProps) => {
  const filteredAndSortedInvestments = sortInvestments(
    filterInvestmentsByStatus(investments, statusFilter),
    sortColumn,
    sortDirection,
  );

  return (
    <Card>
      <CardHeader
        title={title}
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
                onSort={onSort}
              >
                ID
              </SortableTableCell>
              <SortableTableCell
                column='entity'
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                Entity
              </SortableTableCell>
              <SortableTableCell
                column='fund'
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                Fund
              </SortableTableCell>
              <SortableTableCell
                column='status'
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                Status
              </SortableTableCell>
              <SortableTableCell
                column='lastActivity'
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                Last Activity
              </SortableTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedInvestments.map((inv) => (
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
  );
};
