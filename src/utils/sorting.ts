import type { Investment } from './db';
import { getStatusPriority } from './status';

export type SortDirection = 'asc' | 'desc' | null;
export type SortColumn = 'id' | 'entity' | 'fund' | 'status' | 'lastActivity' | null;

export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

export function handleSort(
  currentColumn: SortColumn,
  currentDirection: SortDirection,
  targetColumn: SortColumn,
): SortState {
  if (currentColumn === targetColumn) {
    // If clicking the same column, cycle through: asc -> desc -> null
    if (currentDirection === 'asc') {
      return { column: targetColumn, direction: 'desc' };
    } else if (currentDirection === 'desc') {
      return { column: null, direction: null };
    } else {
      return { column: targetColumn, direction: 'asc' };
    }
  } else {
    // If clicking a different column, start with ascending
    return { column: targetColumn, direction: 'asc' };
  }
}

export function sortInvestments(
  investments: Investment[],
  sortColumn: SortColumn,
  sortDirection: SortDirection,
): Investment[] {
  // Apply sorting if active
  if (sortColumn && sortDirection) {
    return [...investments].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case 'id': {
          aValue = a.id;
          bValue = b.id;
          break;
        }
        case 'entity': {
          aValue = a.investingEntity.toLowerCase();
          bValue = b.investingEntity.toLowerCase();
          break;
        }
        case 'fund': {
          aValue = a.fundName.toLowerCase();
          bValue = b.fundName.toLowerCase();
          break;
        }
        case 'status': {
          // Sort status by priority: in_progress, linked, archived
          aValue = getStatusPriority(a.status);
          bValue = getStatusPriority(b.status);
          break;
        }
        case 'lastActivity': {
          aValue = new Date(a.lastActivityAt).getTime();
          bValue = new Date(b.lastActivityAt).getTime();
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else {
    // Default sorting when no sort is active
    return [...investments].sort((a, b) => {
      const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (statusDiff !== 0) return statusDiff;
      // Secondary sort by ID
      return a.id - b.id;
    });
  }
}
