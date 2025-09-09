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
  // Get all investment IDs that are referenced by any conversation
  const assignedInvestmentIds = new Set<number>();
  Object.values(store.convos).forEach((convo) => {
    convo.investmentRefs.forEach((invId) => assignedInvestmentIds.add(invId));
  });

  // Return investments for this client that are not referenced by any conversation
  return Object.values(store.investments).filter(
    (inv) => inv.clientId === clientId && !assignedInvestmentIds.has(inv.id),
  );
}

export function getProcessInvestments(store: Store, processId: number): Investment[] {
  // Get all investments referenced by conversations in this process
  const process = store.processes[processId];
  if (!process) return [];

  const investmentIds = new Set<number>();
  process.convoIds.forEach((convoId) => {
    const convo = store.convos[convoId];
    if (convo) {
      convo.investmentRefs.forEach((invId) => investmentIds.add(invId));
    }
  });

  // Return the actual investment objects
  return Array.from(investmentIds)
    .map((id) => store.investments[id])
    .filter(Boolean);
}

export function getInvestmentsNotInProcess(
  store: Store,
  processId: number,
  clientId: string,
): Investment[] {
  // Get all investment IDs that are referenced by ANY conversation in this process
  const processInvestmentIds = new Set<number>();
  const process = store.processes[processId];
  if (process) {
    process.convoIds.forEach((convoId) => {
      const convo = store.convos[convoId];
      if (convo) {
        // Add all investment IDs referenced by this conversation
        convo.investmentRefs.forEach((invId) => processInvestmentIds.add(invId));
      }
    });
  }

  // Return all investments for this client that are NOT referenced by any conversation in this process
  // This includes: unassigned investments + investments assigned to other processes
  return Object.values(store.investments).filter(
    (inv) => inv.clientId === clientId && !processInvestmentIds.has(inv.id),
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
