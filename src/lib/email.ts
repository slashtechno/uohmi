import { Resend } from "resend"
import { render } from "react-email"
import { TabEmail } from "@/emails/TabEmail"
import type { Tab, Item } from "./db"
import { appUrl } from "./url"

const FROM = process.env.RESEND_FROM_EMAIL || "uohmi <invoices@yourdomain.com>"

type Kind = "opened" | "item-added" | "finalized" | "reminder"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getDevEmailDir() {
  return "/tmp/uohmi-emails"
}

async function writeDevEmail(to: string, subject: string, html: string) {
  const fs = await import("fs/promises")
  const path = await import("path")
  const dir = getDevEmailDir()
  await fs.mkdir(dir, { recursive: true })
  const filename = `${Date.now()}-${to.replace("@", "-at-")}.html`
  await fs.writeFile(path.join(dir, filename), html)
  console.log(`[DEV] Email written to file://${path.join(dir, filename)}`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
}

export async function sendTabEmail(args: {
  kind: Kind
  tab: Tab
  items: Item[]
  total: number
  balance: number
  latest?: string
}) {
  const payUrl = `${appUrl()}/pay/${args.tab.token}`
  const subject = subjects[args.kind](args.total)
  
  if (process.env.RESEND_API_KEY) {
    await getResend().emails.send({
      from: FROM,
      to: args.tab.recipientEmail,
      subject,
      react: TabEmail({ ...args, payUrl })
    })
  } else {
    const html = await render(TabEmail({ ...args, payUrl }))
    await writeDevEmail(args.tab.recipientEmail, subject, html)
  }
}

const subjects: Record<Kind, (total: number) => string> = {
  opened: () => "a running tab, from your conscience",
  "item-added": (t) => `uohmi update \u2014 running total: $${(t / 100).toFixed(2)}`,
  finalized: (t) => `the final tally: $${(t / 100).toFixed(2)}`,
  reminder: (t) => `friendly reminder \u2014 you still owe $${(t / 100).toFixed(2)}`,
}