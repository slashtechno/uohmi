import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

const screenshotSchema = z.object({
  passed: z.boolean(),
  verdict: z.string()
})

async function getModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    const gateway = createOpenAI({
      baseURL: "https://ai-gateway.vercel.sh/v1",
      apiKey: process.env.AI_GATEWAY_API_KEY
    })
    return gateway("gpt-5-nano")
  }
  
  if (process.env.OPENAI_BASE_URL) {
    const custom = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY || "ollama"
    })
    return custom(process.env.OPENAI_MODEL || "gemma4:e2b")
  }
  
  throw new Error("No AI provider configured. Set AI_GATEWAY_API_KEY or OPENAI_BASE_URL")
}

export async function verifyScreenshot(
  base64: string, 
  mediaType: string, 
  expectedCents: number, 
  method: string
): Promise<{ passed: boolean; verdict: string }> {
  const expected = (expectedCents / 100).toFixed(2)
  
  try {
    const model = await getModel()
    const { object } = await generateObject({
      model,
      schema: screenshotSchema,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Supposed ${method} confirmation for ~$${expected}. Does this look like a real payment confirmation and does the amount roughly match? Reply JSON only.` },
          { type: "image", image: Buffer.from(base64, "base64"), mediaType }
        ]
      }]
    })
    return object
  } catch (e) {
    console.error("AI verification failed:", e)
    return { passed: false, verdict: "Could not analyze screenshot." }
  }
}