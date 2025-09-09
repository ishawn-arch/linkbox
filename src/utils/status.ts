import type { ConvoState } from './db';

export function getStatusPriority(status: string | null): number {
  if (!status) return 4; // Unassigned investments come last
  const statusPriority = {
    in_progress: 1,
    linked: 2,
    archived: 3,
  };
  return statusPriority[status as keyof typeof statusPriority] || 4;
}

export function getStateBadgeProps(state: ConvoState) {
  switch (state) {
    case 'NO_RESPONSE':
      return [{ text: 'no response', tone: 'gray' as const }];
    case 'PENDING_FUND':
      return [{ text: 'pending fund reply', tone: 'blue' as const }];
    case 'PENDING_ARCH':
      return [{ text: 'arch response needed', tone: 'amber' as const }];
    case 'CLOSED':
      return [
        { text: 'closed', tone: 'gray' as const },
        { text: 'no response', tone: 'gray' as const },
      ];
    default:
      return [];
  }
}
