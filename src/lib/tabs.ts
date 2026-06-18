import * as db from './db'
import { sendTabEmail } from './email'
import { notifications } from './notify'

export async function sendTab(tabId: string, finalize: boolean) {
  await db.updateTabStatus(tabId, finalize ? 'CLOSED' : 'OPEN')
  const full = await db.getTabFull(tabId)
  if (!full) return
  await sendTabEmail({ kind: finalize ? 'finalized' : 'opened', ...full })
  await notifications.tabSent(full.tab.recipientName, finalize)
}

export async function addItemAndNotify(tabId: string, description: string, amountCents: number) {
  await db.addItem(tabId, description, amountCents)
  const full = await db.getTabFull(tabId)
  if (!full) return
  if (full.tab.status === 'OPEN') {
    await sendTabEmail({ kind: 'item-added', ...full, latest: description })
  }
}

export async function addItemsBulkAndNotify(tabId: string, items: { description: string; amountCents: number }[]) {
  for (const { description, amountCents } of items) {
    await db.addItem(tabId, description, amountCents)
  }
  const full = await db.getTabFull(tabId)
  if (!full) return
  if (full.tab.status === 'OPEN') {
    const summary = items.map(i => i.description).join(', ')
    await sendTabEmail({ kind: 'item-added', ...full, latest: summary })
  }
}

export async function finalizeTab(tabId: string) {
  await db.updateTabStatus(tabId, 'CLOSED')
  const full = await db.getTabFull(tabId)
  if (!full) return
  await sendTabEmail({ kind: 'finalized', ...full })
}

export async function confirmPaymentAndMaybeClose(paymentId: string, tabId: string) {
  await db.confirmPayment(paymentId)
  const full = await db.getTabFull(tabId)
  if (full && full.balance <= 0) await db.updateTabStatus(tabId, 'PAID')
}

export async function sendReminder(tabId: string) {
  const full = await db.getTabFull(tabId)
  if (!full) return
  await sendTabEmail({ kind: 'reminder', ...full })
  await notifications.tabSent(full.tab.recipientName, false)
}