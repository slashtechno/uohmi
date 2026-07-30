// Two invoicing tones. spotmi is the default — softer, for when the debt came from an
// offer ("get it, I got you") or just needs a low-key nudge. uohmi is opt-in, for when
// you fronted money unprompted and want the classic, pointed framing.
export type Mode = 'uohmi' | 'spotmi'

export const DEFAULT_MODE: Mode = 'spotmi'

interface Brand {
  name: string
  payPageTagline: string
  alreadyPaid: string
  emailOpener: string
  emailPreheaders: {
    opened: string
    'item-added': (latest: string) => string
    finalized: string
    reminder: string
    cancelled: string
    'link-updated': string
    merged: string
  }
  emailFooterTagline: string
  accent: { base: string; dark: string; bg: string }
}

const sharedPreheaders = {
  'item-added': (latest: string) => `Just added: ${latest}. Running total below.`,
  cancelled: "The invoice has been cancelled. You're all clear.",
  'link-updated': 'Your payment link has been updated. Use the button below.',
  merged: 'Two tabs rolled into one. Updated total below.',
}

const brands: Record<Mode, Brand> = {
  uohmi: {
    name: 'uohmi',
    payPageTagline: 'A legally questionable record of kindness.',
    alreadyPaid: "Settled. You're free. Your conscience is clean.",
    emailOpener: 'A precise account of the damage.',
    emailPreheaders: {
      ...sharedPreheaders,
      opened: "I'll add expenses as they come. Pay when convenient.",
      finalized: "That's everything. No more surprises.",
      reminder: 'Just checking in. The debt remains.',
    },
    emailFooterTagline: 'Sent via uohmi — memory is fallible, receipts are not.',
    accent: { base: '#c4847a', dark: '#a8685e', bg: '#fdf0ee' },
  },
  spotmi: {
    name: 'spotmi',
    payPageTagline: 'Just keeping track, nothing serious.',
    alreadyPaid: 'Paid, appreciate it!',
    emailOpener: 'A quick tally of the damage.',
    emailPreheaders: {
      ...sharedPreheaders,
      opened: 'Adding this up as it comes together. Settle whenever works.',
      finalized: "That's the full total — nothing more coming.",
      reminder: "Friendly nudge — this one's still open.",
    },
    emailFooterTagline: 'Sent via spotmi — because I might forget.',
    accent: { base: '#7a9cc4', dark: '#5e7ea8', bg: '#eef3fb' },
  },
}

export function resolveMode(mode?: string | null): Mode {
  return mode === 'uohmi' ? 'uohmi' : DEFAULT_MODE
}

export function getBrand(mode?: string | null): Brand {
  return brands[resolveMode(mode)]
}
