/****************************** TYPES ******************************/
export type OpsMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
export type Client = { id: string; name: string; opsOwnerId: string };
export type FundProcess = {
  id: number;
  fundName: string;
  clientId: string;
  convoIds: string[];
  roundIds: string[];
  createdAt: string;
  lastActivityAt: string;
};
export type InvestmentStatus = 'linked' | 'in_progress' | 'archived';
export type Investment = {
  id: number;
  clientId: string;
  investingEntity: string;
  fundName: string;
  status: InvestmentStatus | null;
  lastActivityAt: string;
};
export type ConvoState = 'NO_RESPONSE' | 'PENDING_FUND' | 'PENDING_ARCH' | 'CLOSED';
export type EmailMsg = {
  id: string;
  ts: string;
  from: string;
  fromRole: 'OPS' | 'ADMIN' | 'FUND' | 'CLIENT';
  to: string[];
  cc?: string[];
  bcc?: string[];
  direction: 'OUT' | 'IN';
  body: string;
};
export type Convo = {
  id: string;
  processId: number;
  aliasEmail: string;
  subject: string;
  participants: string[];
  investmentRefs: number[];
  roundId?: string;
  messageCount: number;
  lastActivityAt: string;
  preview: string;
  state: ConvoState;
  messages: EmailMsg[];
};
export type Round = {
  id: string;
  processId: number;
  label: string;
  sentAt: string;
  convoIds: string[];
};

export type Store = {
  ops: Record<string, OpsMember>;
  clients: Record<string, Client>;
  processes: Record<number, FundProcess>;
  investments: Record<number, Investment>;
  convos: Record<string, Convo>;
  rounds: Record<string, Round>;
};

export type DetailMode = 'CONVERSATIONS' | 'INVESTMENTS';

/****************************** UTILITIES ******************************/
const base32Alphabet = '0123456789abcdefghjkmnpqrstvwxyz';
export const randBase32 = (n: number) =>
  Array.from(
    { length: n },
    () => base32Alphabet[Math.floor(Math.random() * base32Alphabet.length)],
  ).join('');

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString();
export const daysAgoIso = (d: number) =>
  new Date(Date.now() - d * 86400000).toISOString();

export function emailAliasForOps(ops: OpsMember) {
  return `${ops.firstName.toLowerCase()}.${ops.lastName.toLowerCase()}-${randBase32(
    5,
  )}@archinvestorservices.com`;
}

export function getConversationState(convo: Convo, store: Store): ConvoState {
  // If conversation has no investment references, keep current state
  if (convo.investmentRefs.length === 0) {
    return convo.state;
  }

  // Get all investments referenced by this conversation
  const investments = convo.investmentRefs
    .map((id) => store.investments[id])
    .filter(Boolean);

  // If no valid investments found, keep current state
  if (investments.length === 0) {
    return convo.state;
  }

  // Check if all investments are linked or archived
  const allInvestmentsComplete = investments.every(
    (inv) => inv.status === 'linked' || inv.status === 'archived',
  );

  // If all investments are complete, mark conversation as closed
  if (allInvestmentsComplete) {
    return 'CLOSED';
  }

  // If conversation was closed but now has incomplete investments, reopen it
  if (convo.state === 'CLOSED') {
    return 'PENDING_FUND'; // Default state when reopening
  }

  // Otherwise, keep the current state
  return convo.state;
}

export function sortConversationsByPriority(conversations: Convo[]): Convo[] {
  return [...conversations].sort((a, b) => {
    // Define status priority (lower number = higher priority)
    const statusPriority = {
      PENDING_ARCH: 1,
      PENDING_FUND: 2,
      CLOSED: 3,
      NO_RESPONSE: 4, // fallback for any remaining NO_RESPONSE states
    };

    const aPriority = statusPriority[a.state] || 4;
    const bPriority = statusPriority[b.state] || 4;

    // First sort by status priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same status, sort by date (most recent first)
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });
}

/****************************** DEMO DATA SEED ******************************/
export function seedDemo(): Store {
  const ops1: OpsMember = {
    id: 'ops1',
    firstName: 'Neha',
    lastName: 'Patel',
    email: 'neha.patel@arch.com',
  };
  const client1: Client = { id: 'c1', name: 'IFC Advisors', opsOwnerId: ops1.id };
  const client2: Client = { id: 'c2', name: 'Foothill Capital', opsOwnerId: ops1.id };

  const alias1 = emailAliasForOps(ops1);
  const alias2 = emailAliasForOps(ops1);

  const p1: FundProcess = {
    id: 1,
    fundName: 'Landmark Equity Partners',
    clientId: client1.id,
    convoIds: [],
    roundIds: [],
    createdAt: daysAgoIso(30),
    lastActivityAt: daysAgoIso(1),
  };
  const p2: FundProcess = {
    id: 2,
    fundName: 'Blackstone GSO',
    clientId: client2.id,
    convoIds: [],
    roundIds: [],
    createdAt: daysAgoIso(20),
    lastActivityAt: daysAgoIso(2),
  };

  // Create investments for each process
  const invs: Investment[] = [];
  const statuses: InvestmentStatus[] = ['linked', 'in_progress', 'archived'];

  for (let i = 0; i < 10; i++) {
    invs.push({
      id: 282700 + i,
      clientId: client1.id,
      investingEntity: i % 2 === 0 ? 'Holte Living Trust' : 'IFC Advisors LP',
      fundName: i < 5 ? 'Landmark XVI' : 'Landmark Co-Invest A',
      status: statuses[i % statuses.length], // Investments in conversations have status
      lastActivityAt: daysAgoIso(15 - i),
    });
  }

  // Add additional investments for the multi-contact conversation
  invs.push(
    {
      id: 282708,
      clientId: client1.id,
      investingEntity: 'Strategic Capital Partners',
      fundName: 'Landmark XVII',
      status: 'linked', // Completed by admin
      lastActivityAt: daysAgoIso(3),
    },
    {
      id: 282709,
      clientId: client1.id,
      investingEntity: 'Meridian Investment Group',
      fundName: 'Landmark XVII',
      status: 'in_progress', // Still being worked on by fund team
      lastActivityAt: daysAgoIso(2),
    },
  );

  for (let i = 0; i < 10; i++) {
    invs.push({
      id: 283000 + i,
      clientId: client2.id,
      investingEntity: i % 2 === 0 ? 'Foothill Holdings LLC' : 'Cypress Family Trust',
      fundName: i < 6 ? 'GSO Capital Solutions III' : 'GSO Special Situations',
      status: statuses[(i + 1) % statuses.length],
      lastActivityAt: daysAgoIso(10 - i),
    });
  }

  // Add some unassigned investments (available to be added to conversations)
  const unassignedInvs: Investment[] = [];
  for (let i = 0; i < 6; i++) {
    unassignedInvs.push({
      id: 290000 + i,
      clientId: client1.id,
      investingEntity:
        i % 3 === 0
          ? 'Meridian Capital Partners'
          : i % 3 === 1
          ? 'Summit Investment Group'
          : 'Crosswind Holdings',
      fundName: i < 3 ? 'Opportunity Fund IV' : 'Growth Capital Fund II',
      status: null, // No status when not assigned to any conversation
      lastActivityAt: daysAgoIso(20 - i),
    });
  }
  for (let i = 0; i < 4; i++) {
    unassignedInvs.push({
      id: 291000 + i,
      clientId: client2.id,
      investingEntity: i % 2 === 0 ? 'Pinnacle Asset Management' : 'Ridgeline Partners',
      fundName: i < 2 ? 'Strategic Ventures Fund' : 'Capital Opportunities III',
      status: null, // No status when not assigned to any conversation
      lastActivityAt: daysAgoIso(18 - i),
    });
  }

  // Add unassigned investments to the main investments array
  invs.push(...unassignedInvs);

  // Define which investments are actually referenced by conversations
  // These are the only ones that should have a status
  const conversationInvestmentIds = new Set([
    // cv_1_m1 references these 6 from client1
    282700, 282701, 282702, 282703, 282704, 282705,
    // cv_1_m2 references these 2 from client1
    282706, 282707,
    // cv_1_m3 references these 2 from client1 (multi-contact conversation)
    282708, 282709,
    // cv_2_m1 references these 3 from client2
    283001, 283002, 283004,
    // cv_2_m2 references these 2 from client2
    283002, 283004,
  ]);

  // Set status to null for investments not referenced by any conversation
  invs.forEach((inv) => {
    if (!conversationInvestmentIds.has(inv.id)) {
      inv.status = null;
    }
  });

  // Create some basic conversations with messages
  const convosArr: Convo[] = [
    {
      id: 'cv_1_m1',
      processId: p1.id,
      aliasEmail: alias1,
      subject: 'Linking Mailer — Round 1',
      participants: ['ADMIN'],
      investmentRefs: [282700, 282701, 282702, 282703, 282704, 282705],
      messageCount: 2,
      lastActivityAt: daysAgoIso(13),
      preview: 'Automated mailer sent to fund admin for 6 investments.',
      state: 'PENDING_ARCH',
      messages: [
        {
          id: 'm1',
          ts: daysAgoIso(14),
          from: `Test Living Trust via Arch <${alias1}>`,
          fromRole: 'OPS',
          to: ['admin@landmark.com'],
          direction: 'OUT',
          body: 'Important: Investor Request for Portal Access\n\nPlease add test-landmark@archdocuments.com to your records for the investments listed. Once completed, confirm here.',
        },
        {
          id: 'm2',
          ts: daysAgoIso(13),
          from: 'Landmark Admin <admin@landmark.com>',
          fromRole: 'ADMIN',
          to: [alias1],
          direction: 'IN',
          body: 'Thanks — received. We will review internally and circle back once access has been provisioned.',
        },
      ],
    },
    {
      id: 'cv_2_m1',
      processId: p2.id,
      aliasEmail: alias2,
      subject: 'Linking Mailer — Round 1',
      participants: ['ADMIN'],
      investmentRefs: [283001, 283002, 283004], // Only archived and linked investments
      messageCount: 2,
      lastActivityAt: daysAgoIso(11),
      preview: 'Automated mailer sent for 3 investments.',
      state: 'PENDING_FUND', // Will be updated by getConversationState
      messages: [
        {
          id: 'm1',
          ts: daysAgoIso(12),
          from: `Arch <${alias2}>`,
          fromRole: 'OPS',
          to: ['admin@gso.com'],
          direction: 'OUT',
          body: 'Requesting portal access for five investments (Round 1).',
        },
        {
          id: 'm2',
          ts: daysAgoIso(11),
          from: 'GSO Admin <admin@gso.com>',
          fromRole: 'ADMIN',
          to: [alias2],
          direction: 'IN',
          body: 'Completed. You should see invites for all five positions.',
        },
      ],
    },
    {
      id: 'cv_2_m2',
      processId: p2.id,
      aliasEmail: alias2,
      subject: 'Completed Portfolio Links',
      participants: ['ADMIN'],
      investmentRefs: [283002, 283004], // linked and archived (will be all complete)
      messageCount: 1,
      lastActivityAt: daysAgoIso(5),
      preview: 'All portfolio access has been completed.',
      state: 'PENDING_FUND', // Will be updated to CLOSED by getConversationState
      messages: [
        {
          id: 'm3',
          ts: daysAgoIso(5),
          from: 'GSO Admin <admin@gso.com>',
          fromRole: 'ADMIN',
          to: [alias2],
          direction: 'IN',
          body: 'All requested portfolio access has been completed and verified.',
        },
      ],
    },
    {
      id: 'cv_1_m2',
      processId: p1.id,
      aliasEmail: alias1,
      subject: 'Follow-up Request — Additional Positions',
      participants: ['ADMIN'],
      investmentRefs: [282706, 282707], // These have status so will be pending
      messageCount: 1,
      lastActivityAt: daysAgoIso(8),
      preview: 'Follow-up request for additional investment positions.',
      state: 'PENDING_FUND',
      messages: [
        {
          id: 'm4',
          ts: daysAgoIso(8),
          from: `Arch <${alias1}>`,
          fromRole: 'OPS',
          to: ['admin@landmark.com'],
          direction: 'OUT',
          body: 'Follow-up: requesting access for additional positions as discussed.',
        },
      ],
    },
    // Example conversation with multiple firm contacts
    {
      id: 'cv_1_m3',
      processId: p1.id,
      aliasEmail: alias1,
      subject: 'Multiple Contacts — Coordination Required',
      participants: ['ADMIN', 'FUND'],
      investmentRefs: [282708, 282709], // We'll need to add these investments
      messageCount: 5,
      lastActivityAt: daysAgoIso(2),
      preview: 'Multiple firm contacts coordinating access - requires attention.',
      state: 'PENDING_ARCH',
      messages: [
        {
          id: 'm_multi_1',
          ts: daysAgoIso(5),
          from: `Arch <${alias1}>`,
          fromRole: 'OPS',
          to: ['admin@landmark.com', 'operations@landmark.com'],
          direction: 'OUT',
          body: 'Requesting portal access for two additional investments. Please coordinate internally and confirm once completed.',
        },
        {
          id: 'm_multi_2',
          ts: daysAgoIso(4),
          from: 'Landmark Operations <operations@landmark.com>',
          fromRole: 'ADMIN',
          to: [alias1],
          direction: 'IN',
          body: 'Received your request. Our admin team will handle the first investment, and I will personally handle the second one. Expect updates within 24-48 hours.',
        },
        {
          id: 'm_multi_3',
          ts: daysAgoIso(3),
          from: 'Landmark Admin <admin@landmark.com>',
          fromRole: 'ADMIN',
          to: [alias1],
          direction: 'IN',
          body: 'Admin here - I have completed setup for investment #282708. Portal access should be available now. Please verify.',
        },
        {
          id: 'm_multi_4',
          ts: daysAgoIso(2),
          from: 'Landmark Fund Manager <fund.manager@landmark.com>',
          fromRole: 'FUND',
          to: [alias1],
          direction: 'IN',
          body: 'Fund management team here. We are still working on investment #282709 - there are some additional compliance checks required. Will update you by end of week.',
        },
        {
          id: 'm_multi_5',
          ts: daysAgoIso(2),
          from: 'Landmark Operations <operations@landmark.com>',
          fromRole: 'ADMIN',
          to: [alias1],
          direction: 'IN',
          body: 'Operations follow-up: Admin has completed their part, fund team is handling the remaining item. Both teams are coordinated and on track.',
        },
      ],
    },
  ];

  p1.convoIds = ['cv_1_m1', 'cv_1_m2', 'cv_1_m3'];
  p2.convoIds = ['cv_2_m1', 'cv_2_m2'];

  // Update conversation states based on investment completion
  convosArr.forEach((convo) => {
    const tempStore = {
      ops: { [ops1.id]: ops1 },
      clients: { [client1.id]: client1, [client2.id]: client2 },
      processes: { [p1.id]: p1, [p2.id]: p2 },
      investments: invs.reduce(
        (m, x) => ((m[x.id] = x), m),
        {} as Record<number, Investment>,
      ),
      convos: convosArr.reduce((m, x) => ((m[x.id] = x), m), {} as Record<string, Convo>),
      rounds: {},
    };
    convo.state = getConversationState(convo, tempStore);
  });

  // Create rounds
  const r1_p1: Round = {
    id: 'r1_1',
    processId: p1.id,
    label: 'Round 1',
    sentAt: daysAgoIso(14),
    convoIds: ['cv_1_m1', 'cv_1_m2', 'cv_1_m3'],
  };
  const r1_p2: Round = {
    id: 'r1_2',
    processId: p2.id,
    label: 'Round 1',
    sentAt: daysAgoIso(12),
    convoIds: ['cv_2_m1', 'cv_2_m2'],
  };

  p1.roundIds = [r1_p1.id];
  p2.roundIds = [r1_p2.id];

  return {
    ops: { [ops1.id]: ops1 },
    clients: { [client1.id]: client1, [client2.id]: client2 },
    processes: { [p1.id]: p1, [p2.id]: p2 },
    investments: invs.reduce(
      (m, x) => ((m[x.id] = x), m),
      {} as Record<number, Investment>,
    ),
    convos: convosArr.reduce((m, x) => ((m[x.id] = x), m), {} as Record<string, Convo>),
    rounds: { [r1_p1.id]: r1_p1, [r1_p2.id]: r1_p2 },
  };
}
