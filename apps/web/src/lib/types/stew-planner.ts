// Shared types for the Stew Planner — the AI-to-AI clarifying agent that
// interviews the user before a fresh build. A "stew" is a fully-formed
// build prompt; "ingredients" are the dimensions a good one needs.
//
// Used by both /api/builder/clarify (the agent brain) and the workspace
// client (StewPlannerChat / StewPlannerModal). Keep this file dependency-free
// so it can be imported from a route and a client component alike.

// One round-trip in the clarifying conversation.
export interface ClarifyTurn {
  role: 'user' | 'assistant'
  content: string
}

// The accumulated understanding of what the user wants. The agent fills
// these slots over a few turns; `completeness` and `turnCount` are its own
// progress bookkeeping. `assembledPrompt` is populated once it's done.
export interface StewPlan {
  businessName?: string
  industry?: string
  audience: string
  pages: string[]
  sections: string[]
  visualStyle: string
  colorScheme?: string
  contentMode: 'real' | 'placeholder' | 'mixed'
  integrations: string[]
  tone?: string
  referenceUrl?: string
  completeness: number   // 0–100; the planner unlocks "Go" at >= 70
  turnCount: number
  assembledPrompt?: string
}

// POST body for /api/builder/clarify.
export interface ClarifyRequest {
  userMessage: string
  history: ClarifyTurn[]
  plan: Partial<StewPlan>
  model?: string
  apiKey?: string
}

// JSON response from /api/builder/clarify (non-streaming — each turn is one
// short question, fast enough that SSE buys nothing).
export interface ClarifyResponse {
  question?: string            // next question to show; absent when done
  updatedPlan: Partial<StewPlan>
  done: boolean                // true once the agent has enough to build
  assembledPrompt?: string     // the finished "stew" — populated when done
  suggestedReplies?: string[]  // 2–3 one-tap quick replies for the question
}

// Submit payload from the planner chat surface. Input-source-abstracted so a
// voice assistant (Aria) can later swap in by passing source:'voice' — the
// planner logic only ever reads `text`.
export interface ClarifySubmitPayload {
  text: string
  source: 'text' | 'voice'
}
