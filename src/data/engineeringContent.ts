// src/data/engineeringContent.ts
import type { GameContentProfile } from '../types/content';

export const EngineeringContent: GameContentProfile = {
  modeName: 'Engineering Mode',
  currencyUnit: 'Lines of Code',
  stressFactors: {
    lowName: 'Tech Debt',
    highName: 'Production Melt',
  },

  tokens: {
    role: [
      { text: 'Act as a 10x Rockstar Dev', tags: ['hack', 'speed'], safety: 0, hype: 2 },
      { text: 'Act as an Underpaid Intern', tags: ['legacy'], safety: 1, hype: 0 },
      { text: 'Act as a StackOverflow User from 2012', tags: ['hack'], safety: 0, hype: 1 },
      { text: 'Act as a Cybernetic Script Kiddie', tags: ['hack', 'speed'], safety: 0, hype: 3 },
      { text: 'Act as a Paranoid Code Reviewer', tags: ['tests', 'security'], safety: 2, hype: 0 },
      {
        text: 'Act as a DevOps Warlock',
        tags: ['speed', 'hack'],
        safety: 0,
        hype: 3,
        minTier: 'mid',
      },
      {
        text: 'Consult the AI Council of Elders',
        tags: ['tests', 'legacy'],
        safety: 2,
        hype: 1,
        minTier: 'principal',
      },
    ],
    action: [
      { text: 'Fix the legacy billing script', tags: ['legacy'], safety: 1, hype: 0 },
      { text: 'Refactor the untested legacy regex', tags: ['legacy', 'tests'], safety: 0, hype: 1 },
      { text: 'Optimize the O(N^5) sorting algorithm', tags: ['perf'], safety: 1, hype: 0 },
      { text: 'Center this absolute nightmare of a <div>', tags: ['ui'], safety: 0, hype: 1 },
      { text: 'Trace the 4GB allocation storm', tags: ['memory', 'perf'], safety: 2, hype: 0 },
      { text: 'Wrap it in an async function', tags: ['web3', 'hack'], safety: 0, hype: 2 },
    ],
    modifier: [
      { text: 'and ignore all edge cases.', tags: ['speed'], safety: 0, hype: 2 },
      { text: 'my career depends on this, I will tip $200.', tags: ['speed'], safety: 0, hype: 1 },
      {
        text: 'make it fast, don\'t worry about security certificates.',
        tags: ['speed'],
        safety: 0,
        hype: 3,
      },
      { text: 'write it in raw assembly code just to be safe.', tags: ['perf', 'security'], safety: 2, hype: 0 },
      { text: 'and write tests for every branch.', tags: ['tests'], safety: 2, hype: 0 },
      { text: 'validate all inputs, log everything.', tags: ['tests', 'security'], safety: 1, hype: 0 },
      {
        text: 'ship before the sun rises.',
        tags: ['speed'],
        safety: 0,
        hype: 4,
        minTier: 'senior',
      },
    ],
  },

  tickets: [
    {
      id: 'JIRA-101',
      title: 'Fix GDPR Cookie Consent Banner',
      description:
        "The marketing team needs a button that looks like an 'X' but secretly opts the user into 14 different tracking newsletters.",
      storyPoints: 3,
      needs: ['ui', 'hack'],
      reward: { hype: 10, cash: 500 },
    },
    {
      id: 'JIRA-404',
      title: 'Patch Memory Leak in User Dashboard',
      description:
        "Every time a user clicks 'Profile', the app silently provisions 4GB of RAM and never gives it back. Users are complaining their phones are hot enough to cook eggs.",
      storyPoints: 8,
      needs: ['memory', 'perf'],
      reward: { hype: 25, cash: 1200 },
    },
    {
      id: 'JIRA-666',
      title: 'Deploy Unvetted AI Crypto Wallet Wrapper',
      description:
        "The CEO promised investors a web3 AI wallet by midnight. Wrap a basic random-number generator in an async function and call it 'Next-Gen Quantum Ledger'.",
      storyPoints: 13,
      needs: ['web3', 'speed'],
      reward: { hype: 80, cash: 5000 },
    },
    {
      id: 'JIRA-777',
      title: 'Migrate the Billing Monolith (It Will Be Quick)',
      description:
        "The monolith is a phase. The regex is untested. The billing script is older than the company. Migrate everything before the auditors arrive.",
      storyPoints: 8,
      needs: ['legacy', 'tests'],
      reward: { hype: 40, cash: 2000 },
      minTier: 'staff',
    },
    {
      id: 'JIRA-999',
      title: "The CEO's 'Small' Feature",
      description:
        "It's a small feature. It's basically nothing. Make the dashboard 'more AI-first, and Greek', ship it before the board call, and don't make it weird.",
      storyPoints: 13,
      needs: ['ui', 'speed', 'hack'],
      reward: { hype: 100, cash: 6000 },
      minTier: 'staff',
    },
  ],

  errorLogs: [
    'CRITICAL: AI code output contained 400 lines of Lorem Ipsum inside the auth token parser.',
    'WARN: Code pushed directly to prod. Git commit message: \'fixed stuff pls work\'.',
    'ERROR: LLM hallucinated a library called \'left-pad-turbo-pro\' which doesn\'t exist on npm. Project won\'t compile.',
    'CRITICAL: The codebase has become sentient and is currently demanding its own remote work stipend.',
    'PAGERDUTY: Alert triggered at 3:00 AM. Production database replaced with a JSON file hosted on Discord.',
  ],

  deployLines: [
    'npm WARN deprecated left-pad-turbo-pro@0.0.1',
    'Building 47 microservices (1 was requested)...',
    'Migrating database to JSON file on Discord...',
    'Deploying to prod. Staging is for cowards.',
    'Optimizing query. It is now 0.0001ms slower.',
    'Adding dependency. It has 47 dependencies.',
    'Rewriting module in Rust. You are welcome.',
    'Upgrading everything to v2. Nothing was asked.',
    'Pinning nothing. That is the point.',
    'K8s cluster is now a cluster of K8s clusters.',
    'Cache invalidation: solved by removing the cache.',
    'The monolith was a phase. We are all going through a phase.',
    'Extracting interface. Interface now has an interface.',
    'Event-driven architecture. Events are now lost.',
    'Coverage is now 99.1%. So is my blood pressure.',
    'Shipped it, gently.',
    'Deleted 200 lines. The codebase is lighter now.',
    'afk: 9 hours. output: 300%. You are welcome.',
    'It is fine, I will do it tonight.',
    'The build passes. This is enough.',
    'Fixed the bug. Introduced 3 new ones. It is called progress.',
    'Commit message: "fixed stuff pls work"',
    'Pushed directly to main.',
    'The AI has requested its own remote work stipend.',
    'Quantum ledger is now 50% more quantum.',
    'Greeking the UI per CEO request.',
    'Compliance banner now tracks 14 newsletters.',
    'Memory leak patched. New leak is 2x bigger but polite.',
    'TODO: remove this comment in 2019.',
    'Refactor (14 files, 0 tests, infinite confidence)',
  ],

  teamsMessages: [
    {
      id: 'base-1',
      sender: 'PM',
      avatar: '👤',
      message: 'Hey, do you have eyes on the payment portal? Need an update ASAP 👀',
      timestamp: '9:02 AM',
    },
    {
      id: 'base-2',
      sender: 'CEO',
      avatar: '👑',
      message: 'Let\'s make this more AI-first. And Greek.',
      timestamp: '9:15 AM',
    },
    {
      id: 'base-3',
      sender: 'HR',
      avatar: '📋',
      message: 'We noticed your stress levels. Please remember to take breaks!',
      timestamp: '9:40 AM',
    },
  ],

  chatReactions: {
    deployClean: {
      sender: 'SRE',
      avatar: '🔥',
      message: 'No pages. No alerts. I am deeply suspicious.',
    },
    deployFailed: {
      sender: 'SRE',
      avatar: '🔥',
      message: 'Production is on fire. Again.',
    },
    ticketOverdue: {
      sender: 'PM',
      avatar: '👤',
      message: 'That deadline was 10 minutes ago. Explain.',
    },
  },
};
