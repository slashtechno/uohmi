const BASE = (process.env.GSDB_URL ?? '').replace(/\/$/, '')
const APP  = process.env.GSDB_APP_ID ?? ''
const KEY  = process.env.GSDB_API_KEY ?? ''

const H = (extra?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${KEY}`,
  ...extra,
})

type Row = Record<string, any> & { _row: number }

async function all<T = Row>(table: string): Promise<(T & { _row: number })[]> {
  if (!BASE || !APP || !KEY) return []
  const r = await fetch(`${BASE}/api/${APP}/${table}`, { headers: H(), cache: 'no-store' })
  if (!r.ok) return []
  return r.json()
}

// Only nanoid-style alphanumeric+hyphen+underscore values are safe to interpolate into GViz SQL.
// The backend doesn't advertise parameterized queries, so we validate before interpolation.
function safeId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new Error(`Unsafe value for GViz query: ${value}`)
  return value
}

// query() is for reads only — no _row returned (intentional GSDB design).
// For mutations use findRow() which goes through all().
async function query<T = Row>(table: string, sql: string): Promise<T[]> {
  if (!BASE || !APP || !KEY) return []
  const r = await fetch(`${BASE}/api/${APP}/${table}/query`, {
    method: 'POST', headers: H(), body: JSON.stringify({ sql }), cache: 'no-store',
  })
  if (!r.ok) return []
  const data = await r.json()
  return data.rows ?? data
}

async function findRow<T>(table: string, predicate: (r: T & { _row: number }) => boolean): Promise<(T & { _row: number }) | null> {
  const rows = await all<T>(table)
  return rows.find(predicate) ?? null
}

async function append(table: string, row: Record<string, unknown>): Promise<void> {
  if (!BASE || !APP || !KEY) return
  const r = await fetch(`${BASE}/api/${APP}/${table}`, {
    method: 'POST', headers: H(), body: JSON.stringify(row),
  })
  if (!r.ok) return
}

async function update(table: string, rowIndex: number, fields: Record<string, unknown>): Promise<void> {
  const r = await fetch(`${BASE}/api/${APP}/${table}/${rowIndex}`, {
    method: 'PATCH', headers: H(), body: JSON.stringify(fields),
  })
  if (!r.ok) throw new Error(`gsdb PATCH ${table}/${rowIndex} → ${r.status}`)
}

async function remove(table: string, rowIndex: number): Promise<void> {
  const r = await fetch(`${BASE}/api/${APP}/${table}/${rowIndex}`, {
    method: 'DELETE', headers: H(),
  })
  if (!r.ok) throw new Error(`gsdb DELETE ${table}/${rowIndex} → ${r.status}`)
}


export type TabStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'PAID' | 'FORGIVEN'

export interface Tab {
  id: string; token: string
  recipientName: string; recipientEmail: string
  status: TabStatus
  notes?: string; receiptFileKey?: string
  createdAt: string; closedAt?: string
  _row: number
}

function coerceTab(r: any): Tab {
  return r as Tab
}

export async function createTab(input: {
  recipientName: string; recipientEmail: string; notes?: string
}): Promise<Tab> {
  const { nanoid } = await import('nanoid')
  const tab = {
    id: nanoid(10), token: nanoid(16), status: 'DRAFT' as TabStatus,
    createdAt: new Date().toISOString(),
    ...input,
  }
  await append('Tabs', tab as any)
  return coerceTab({ ...tab, _row: -1 })
}

export async function getTabs(): Promise<Tab[]> {
  return (await all<Tab>('Tabs')).map(coerceTab).reverse()
}

export async function getTab(id: string): Promise<Tab | null> {
  const rows = await query<Tab>('Tabs', `SELECT * WHERE id = '${safeId(id)}'`)
  return rows[0] ? coerceTab(rows[0]) : null
}

export async function getTabByToken(token: string): Promise<Tab | null> {
  const rows = await query<Tab>('Tabs', `SELECT * WHERE token = '${safeId(token)}'`)
  return rows[0] ? coerceTab(rows[0]) : null
}

export async function updateTabStatus(id: string, status: TabStatus) {
  const r = await findRow<Tab>('Tabs', row => row.id === id)
  if (!r) return
  const extra = ['CLOSED','PAID','FORGIVEN'].includes(status) ? { closedAt: new Date().toISOString() } : {}
  await update('Tabs', r._row, { status, ...extra })
}

export async function setTabReceiptKey(id: string, fileKey: string) {
  const r = await findRow<Tab>('Tabs', row => row.id === id)
  if (r) await update('Tabs', r._row, { receiptFileKey: fileKey })
}

export async function updateTab(id: string, fields: { recipientName?: string; recipientEmail?: string; notes?: string }) {
  const r = await findRow<Tab>('Tabs', row => row.id === id)
  if (r) await update('Tabs', r._row, fields)
}

export interface Item {
  id: string; tabId: string; description: string; amountCents: number; createdAt: string; _row: number
}

export async function addItem(tabId: string, description: string, amountCents: number): Promise<Item> {
  const { nanoid } = await import('nanoid')
  const item = { id: nanoid(10), tabId, description, amountCents, createdAt: new Date().toISOString() }
  await append('Items', item)
  return { ...item, _row: -1 }
}

export async function getItems(tabId: string): Promise<Item[]> {
  const rows = await query<Item>('Items', `SELECT * WHERE tabId = '${safeId(tabId)}'`)
  return rows.map(r => ({ ...r, amountCents: Number(r.amountCents) }))
}

export async function deleteItem(itemId: string) {
  const r = await findRow<Item>('Items', row => row.id === itemId)
  if (r) await remove('Items', r._row)
}

export async function deleteTab(tabId: string) {
  const r = await findRow<Tab>('Tabs', row => row.id === tabId)
  if (r) await remove('Tabs', r._row)
}

export type Method = 'CASH' | 'ZELLE' | 'OTHER'

export interface Payment {
  id: string; tabId: string; amountCents: number; method: Method
  confirmed: boolean; senderNote?: string; createdAt: string; _row: number
}

export async function addPayment(p: Omit<Payment, 'id'|'createdAt'|'_row'>): Promise<Payment> {
  const { nanoid } = await import('nanoid')
  const row = {
    ...p, id: nanoid(10), createdAt: new Date().toISOString(),
    confirmed: String(p.confirmed).toUpperCase(),
  }
  await append('Payments', row as any)
  return { ...p, id: row.id, createdAt: row.createdAt, _row: -1 }
}

export async function getPayments(tabId: string): Promise<Payment[]> {
  const rows = await query<Payment>('Payments', `SELECT * WHERE tabId = '${safeId(tabId)}'`)
  return rows.map(r => ({
    ...r,
    amountCents: Number(r.amountCents),
    confirmed: String(r.confirmed).toUpperCase() === 'TRUE',
  }))
}

export async function confirmPayment(paymentId: string) {
  const r = await findRow<Payment>('Payments', row => row.id === paymentId)
  if (r) await update('Payments', r._row, { confirmed: 'TRUE' })
}

function tally(items: Item[], payments: Payment[]) {
  const total = items.reduce((s, i) => s + i.amountCents, 0)
  const confirmedPaid = payments.filter(p => p.confirmed).reduce((s, p) => s + p.amountCents, 0)
  return { total, confirmedPaid, balance: total - confirmedPaid, hasUnconfirmed: payments.some(p => !p.confirmed) }
}

export async function getTabFull(tabId: string) {
  const [tab, items, payments] = await Promise.all([getTab(tabId), getItems(tabId), getPayments(tabId)])
  if (!tab) return null
  return { tab, items, payments, ...tally(items, payments) }
}

export async function getTabsFull() {
  const [allTabs, allItems, allPayments] = await Promise.all([all<Tab>('Tabs'), all<Item>('Items'), all<Payment>('Payments')])
  return allTabs.map(coerceTab).reverse().map(tab => {
    const items = allItems.filter(r => r.tabId === tab.id).map(r => ({ ...r, amountCents: Number(r.amountCents) })) as Item[]
    const payments = allPayments.filter(r => r.tabId === tab.id).map(r => ({
      ...r,
      amountCents: Number(r.amountCents),
      confirmed: String(r.confirmed).toUpperCase() === 'TRUE',
    })) as Payment[]
    return { tab, items, payments, ...tally(items, payments) }
  })
}

export async function uploadFile(key: string, bytes: Buffer, contentType: string): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/api/${APP}/files/${key}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': contentType },
      body: new Uint8Array(bytes),
    })
    if (r.status === 501) return null
    return r.ok ? key : null
  } catch { return null }
}

export async function getFileUrl(key: string): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/api/${APP}/files/${key}`, { headers: H() })
    if (!r.ok) return null
    const { url } = await r.json()
    return url as string
  } catch { return null }
}

export async function deleteFile(key: string): Promise<void> {
  await fetch(`${BASE}/api/${APP}/files/${key}`, { method: 'DELETE', headers: H() }).catch(() => {})
}