import { ToolLoopAgent, Output } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

const receiptSchema = z.object({
  // Not used in code: asking for it nudges the model to identify the payee, which helps it name generic lines.
  merchant: z.string().nullable().describe("Business or payee name printed on the receipt, or null if none is shown."),
  totalCents: z.number().int().describe("The final amount actually charged, exactly as printed on the receipt (grand total / amount paid), in cents."),
  items: z.array(z.object({
    description: z.string(),
    amountCents: z.number().int().describe("Amount in cents, e.g. 1250 for $12.50. Never negative."),
  })),
})

const agentOutput = Output.object({ schema: receiptSchema })

// All extraction rules live here, in one place, so they can't contradict each other.
const INSTRUCTIONS = `You extract expense line items from receipts for an expense-splitting app. The item amounts must add up to the final amount charged (totalCents).

- List each purchased item with its line total, including the quantity in the description if shown.
- Tax, fees and tip printed as their own lines are items too, labelled as on the receipt. If prices already include tax, don't add a tax item.
- Don't list subtotals, totals or payment/tender rows. Amounts are never negative: fold a discount into the line it applies to.
- Each description must be understandable on its own next to items from other receipts. If a line is generic, name it from the merchant and what was bought.`

function getModel() {
  if (process.env.OPENAI_BASE_URL) {
    const custom = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY || "ollama",
    })
    return custom(process.env.OPENAI_MODEL || "gemma4:e2b")
  }
  return "openai/gpt-5-nano"
}

/** Safe-to-show-the-user failure (as opposed to provider/gateway errors, which stay server-side). */
export class UnsupportedReceiptError extends Error {}

type Item = { description: string; amountCents: number }
export type ParsedReceipt = { items: Item[]; warning?: string }

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`
const sum = (items: Item[]) => items.reduce((n, i) => n + i.amountCents, 0)

export async function parseReceipt(image: ArrayBuffer, mediaType = "image/png"): Promise<ParsedReceipt> {
  const isPdf = mediaType === "application/pdf"
  if (isPdf && process.env.OPENAI_BASE_URL) {
    throw new UnsupportedReceiptError("PDF receipts aren't supported with a custom OPENAI_BASE_URL model; upload an image instead.")
  }
  const agent = new ToolLoopAgent({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: getModel() as any,
    output: agentOutput,
    instructions: INSTRUCTIONS,
  })

  const run = async (correction?: string) => {
    const { output } = await agent.generate({
      prompt: [{
        role: "user",
        content: [
          { type: "text", text: "Extract the line items from this receipt." + (correction ? `\n\n${correction}` : "") },
          isPdf ? { type: "file", data: image, mediaType } : { type: "image", image },
        ],
      }],
    })
    return output
  }

  let out = await run()
  // Self-check against the printed total; retry once with the discrepancy spelled out.
  if (out.totalCents > 0 && Math.abs(sum(out.items) - out.totalCents) > 1) {
    out = await run(
      `A previous attempt returned items adding up to ${dollars(sum(out.items))}, but the final amount charged is ${dollars(out.totalCents)}. ` +
      `Re-read the receipt and fix the items so they add up to the amount charged.`
    )
  }

  const { items } = out
  const total = sum(items)
  return out.totalCents > 0 && Math.abs(total - out.totalCents) > 1
    ? { items, warning: `Items add up to ${dollars(total)} but the receipt total is ${dollars(out.totalCents)} — check tax, tip or discounts.` }
    : { items }
}
