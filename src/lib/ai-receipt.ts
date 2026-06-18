import { ToolLoopAgent, Output } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

const receiptSchema = z.object({
  items: z.array(z.object({
    description: z.string().describe("Description of the item. For food/goods, include quantity if shown, e.g. 'Craft Lager (×2)'. For tax/fees use the label from the receipt, e.g. 'Tax (9.5%)'. For gratuity use e.g. 'Gratuity (18%)'."),
    amountCents: z.number().int().describe("Amount in cents, e.g. 1250 for $12.50. For food items with quantity, use the line total. For tax/tip, use the exact dollar amount shown."),
  })).describe("All line items including tax and gratuity, but excluding the receipt total/subtotal rows. The sum of all items should equal what was actually paid."),
})

const agentOutput = Output.object({ schema: receiptSchema })

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

export async function parseReceipt(image: ArrayBuffer): Promise<{ items: { description: string; amountCents: number }[] }> {
  const agent = new ToolLoopAgent({
    model: getModel() as any,
    output: agentOutput,
    instructions: "You extract expense line items from receipt images for an expense tracking app.",
  })

  const { output } = await agent.generate({
    prompt: [{
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract every line item from this receipt as a flat list. Include food/goods items, tax, and gratuity — but exclude subtotal and total rows. For items with a quantity, include it in the description (e.g. 'Craft Lager (×2)') and use the line total as the amount. The sum of all returned items should equal the total amount paid on the receipt.",
        },
        { type: "image", image },
      ],
    }],
  })

  return output
}
