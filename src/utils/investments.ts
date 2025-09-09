import type { Store, Investment } from './db';
import { getStatusPriority } from './status';

export interface InvestmentCounts {
  total: number;
  linked: number;
  inProgress: number;
  archived: number;
}

export function calculateInvestmentCounts(investments: Investment[]): InvestmentCounts {
  const total = investments.length;
  const linked = investments.filter((i) => i.status === 'linked').length;
  const inProgress = investments.filter((i) => i.status === 'in_progress').length;
  const archived = investments.filter((i) => i.status === 'archived').length;

  return { total, linked, inProgress, archived };
}

export function getConversationInvestments(
  processInvestments: Investment[],
  selectedConvoId: string | null,
  store: Store | null,
): Investment[] {
  let filtered = processInvestments;

  // Filter by selected conversation if one is selected
  if (selectedConvoId && store) {
    const selectedConvo = store.convos[selectedConvoId];
    if (selectedConvo) {
      filtered = filtered.filter((inv) => selectedConvo.investmentRefs.includes(inv.id));
    }
  }

  return filtered;
}

export function filterInvestmentsByStatus(
  investments: Investment[],
  statusFilter: string | null,
): Investment[] {
  // Apply status filter
  if (statusFilter) {
    return investments.filter((inv) => inv.status === statusFilter);
  }
  return investments;
}

export function getUnassignedInvestments(store: Store, clientId: string): Investment[] {
  return Object.values(store.investments).filter(
    (inv) => inv.firmProcessId === null && inv.clientId === clientId,
  );
}

export function sortInvestmentsByDefault(investments: Investment[]): Investment[] {
  return [...investments].sort((a, b) => {
    // Sort order: in_progress, linked, archived, then by ID
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) return statusDiff;
    return a.id - b.id;
  });
}
