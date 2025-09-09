/****************************** TYPES ******************************/
export type OpsMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
export type Client = { id: string; name: string; opsOwnerId: string };
export type FirmProcess = {
  id: number;
  firmName: string;
  clientId: string;
  investmentIds: number[];
  convoIds: string[];
  roundIds: string[];
  createdAt: string;
  lastActivityAt: string;
};
export type InvestmentStatus = 'linked' | 'in_progress' | 'archived';
export type Investment = {
  id: number;
  clientId: string;
  firmProcessId: number | null;
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
  investmentIds: number[];
  convoIds: string[];
};

export type Store = {
  ops: Record<string, OpsMember>;
  clients: Record<string, Client>;
  processes: Record<number, FirmProcess>;
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

  const p1: FirmProcess = {
    id: 1,
    firmName: 'Landmark Equity Partners',
    clientId: client1.id,
    investmentIds: [],
    convoIds: [],
    roundIds: [],
    createdAt: daysAgoIso(30),
    lastActivityAt: daysAgoIso(1),
  };
  const p2: FirmProcess = {
    id: 2,
    firmName: 'Blackstone GSO',
    clientId: client2.id,
    investmentIds: [],
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
      firmProcessId: p1.id,
      investingEntity: i % 2 === 0 ? 'Holte Living Trust' : 'IFC Advisors LP',
      fundName: i < 5 ? 'Landmark XVI' : 'Landmark Co-Invest A',
      status: statuses[i % statuses.length], // Process investments have status
      lastActivityAt: daysAgoIso(15 - i),
    });
  }

  for (let i = 0; i < 10; i++) {
    invs.push({
      id: 283000 + i,
      clientId: client2.id,
      firmProcessId: p2.id,
      investingEntity: i % 2 === 0 ? 'Foothill Holdings LLC' : 'Cypress Family Trust',
      fundName: i < 6 ? 'GSO Capital Solutions III' : 'GSO Special Situations',
      status: statuses[(i + 1) % statuses.length],
      lastActivityAt: daysAgoIso(10 - i),
    });
  }

  // Add some unassigned investments (available to be added to processes)
  const unassignedInvs: Investment[] = [];
  for (let i = 0; i < 6; i++) {
    unassignedInvs.push({
      id: 290000 + i,
      clientId: client1.id,
      firmProcessId: null, // Not assigned to any process
      investingEntity:
        i % 3 === 0
          ? 'Meridian Capital Partners'
          : i % 3 === 1
          ? 'Summit Investment Group'
          : 'Crosswind Holdings',
      fundName: i < 3 ? 'Opportunity Fund IV' : 'Growth Capital Fund II',
      status: null, // No status when not assigned to a process
      lastActivityAt: daysAgoIso(20 - i),
    });
  }
  for (let i = 0; i < 4; i++) {
    unassignedInvs.push({
      id: 291000 + i,
      clientId: client2.id,
      firmProcessId: null, // Not assigned to any process
      investingEntity: i % 2 === 0 ? 'Pinnacle Asset Management' : 'Ridgeline Partners',
      fundName: i < 2 ? 'Strategic Ventures Fund' : 'Capital Opportunities III',
      status: null, // No status when not assigned to a process
      lastActivityAt: daysAgoIso(18 - i),
    });
  }

  // Add unassigned investments to the main investments array
  invs.push(...unassignedInvs);

  // Assign investments to processes
  p1.investmentIds = invs.filter((x) => x.firmProcessId === p1.id).map((x) => x.id);
  p2.investmentIds = invs.filter((x) => x.firmProcessId === p2.id).map((x) => x.id);

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
      state: 'PENDING_FUND',
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
      investmentRefs: [283000, 283001, 283002, 283003, 283004],
      messageCount: 2,
      lastActivityAt: daysAgoIso(11),
      preview: 'Automated mailer sent for 5 investments.',
      state: 'CLOSED',
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
  ];

  p1.convoIds = ['cv_1_m1'];
  p2.convoIds = ['cv_2_m1'];

  // Create rounds
  const r1_p1: Round = {
    id: 'r1_1',
    processId: p1.id,
    label: 'Round 1',
    sentAt: daysAgoIso(14),
    investmentIds: p1.investmentIds.slice(0, 6),
    convoIds: ['cv_1_m1'],
  };
  const r1_p2: Round = {
    id: 'r1_2',
    processId: p2.id,
    label: 'Round 1',
    sentAt: daysAgoIso(12),
    investmentIds: p2.investmentIds.slice(0, 5),
    convoIds: ['cv_2_m1'],
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
