import { Box, TableCell } from '@mui/material';
import {
  UnfoldMore as UnsortedIcon,
  KeyboardArrowUp as SortAscIcon,
  KeyboardArrowDown as SortDescIcon,
} from '@mui/icons-material';

export type SortDirection = 'asc' | 'desc' | null;
export type SortColumn = 'id' | 'entity' | 'fund' | 'status' | 'lastActivity' | null;

export interface SortableTableCellProps {
  column: SortColumn;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export const SortableTableCell = ({
  column,
  children,
  align = 'left',
  sortColumn,
  sortDirection,
  onSort,
}: SortableTableCellProps) => {
  const isActive = sortColumn === column;
  const direction = isActive ? sortDirection : null;

  let SortIcon;
  if (direction === 'asc') {
    SortIcon = SortAscIcon;
  } else if (direction === 'desc') {
    SortIcon = SortDescIcon;
  } else {
    SortIcon = UnsortedIcon;
  }

  return (
    <TableCell
      align={align}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
      onClick={() => onSort(column)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {children}
        <SortIcon
          sx={{
            fontSize: 16,
            color: isActive ? 'primary.main' : 'text.secondary',
            opacity: isActive ? 1 : 0.5,
          }}
        />
      </Box>
    </TableCell>
  );
};
