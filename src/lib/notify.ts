const BASE = 'https://ntfy.sh'
const TOPIC = process.env.NTFY_TOPIC!
const INCLUDE_PII = process.env.NTFY_INCLUDE_PII === 'true'

async function push(opts: { title: string; message: string; priority?: string; tags?: string[]; click?: string }) {
  if (!TOPIC) return
  try {
    await fetch(`${BASE}/${TOPIC}`, {
      method: 'POST',
      headers: {
        Title: opts.title, Priority: opts.priority ?? 'default',
        Tags: (opts.tags ?? []).join(','),
        ...(opts.click ? { Click: opts.click } : {}),
      },
      body: opts.message,
    })
  } catch (e) { console.error('ntfy failed', e) }
}

const adminUrl = (id: string) => `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${id}`

export const notifications = {
  tabSent: (name: string, finalized: boolean) =>
    push({ title: 'Sent', message: INCLUDE_PII ? `Invoice sent to ${name}. ${finalized ? 'Now we wait.' : 'Running tab is live.'}` : `Invoice sent. ${finalized ? 'Now we wait.' : 'Running tab is live.'}`, tags: ['email'] }),
  viewed: (name: string, id: string) =>
    push({ title: 'Viewed', message: INCLUDE_PII ? `${name} opened their invoice.` : 'Invoice opened.', tags: ['eyes'], click: adminUrl(id) }),
  paymentClaimed: (name: string, method: string, id: string) =>
    push({ title: 'Payment claimed', message: INCLUDE_PII ? `${name} says they paid via ${method}. Confirm it?` : `Payment claimed via ${method}. Confirm it?`, priority: 'high', tags: ['moneybag'], click: adminUrl(id) }),
}