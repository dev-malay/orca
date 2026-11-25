import { z } from 'zod'

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(), 
  updatedAt: z.number()
})

export type Space = z.infer<typeof SpaceSchema>

export const PageTreeNodeSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  parentId: z.string().nullable(),
  title: z.string(),
  updatedAt: z.number()
})

export type PageTreeNode = z.infer<typeof PageTreeNodeSchema>


export const PageSchema = PageTreeNodeSchema.extend({
  content: z.string(),
  revision: z.number(), 
  createdAt: z.number()
})

export type Page = z.infer<typeof PageSchema>

export const CreateSpaceInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
})

export type CreateSpaceInput = z.infer<typeof CreateSpaceInputSchema>

export const CreatePageInputSchema = z.object({
  parentId: z.string().nullish(), 
  title: z.string().trim().max(300).optional(), 
})

export type CreatePageInput = z.infer<typeof CreatePageInputSchema>

export const UpdatePageInputSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  parentId: z.string().nullish()
})

export type UpdatePageInput = z.infer<typeof UpdatePageInputSchema>

export const UpdatePageContentInputSchema = z.object({
  content: z.string(),
  baseRevision: z.number().int().min(0),
})

export type UpdatePageContentInput = z.infer<typeof UpdatePageContentInputSchema>

// Rich content

// pages.content holds a serialized TipTap document. Legacy pages still hold
// plain markdown text, so every reader goes through parseRichContent and
// falls back to treating the raw string as plain text when it is not a doc

export type RichContentNode = {
  type: string
  text?: string
  content?: RichContentNode[]
}

export type RichContentDoc = RichContentNode & { type: 'doc' }

export const richContentNodeSchema: z.ZodType<RichContentNode> = z.lazy(() =>
  z.looseObject({
    type: z.string(),
    text: z.string().optional(),
    content: z.array(richContentNodeSchema).optional(),
  }),
)

export const richContentDocSchema = z.looseObject({
  type: z.literal('doc'),
  content: z.array(richContentNodeSchema),
})

export function parseRichContent(content: string): RichContentDoc | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return null
  }
  const result = richContentDocSchema.safeParse(parsed)
  return result.success ? (result.data as RichContentDoc) : null
}

const blockTypes = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
])

function nodeText(node: RichContentNode): string {
  if (node.type === 'text') return node.text ?? ''
  const parts: string[] = []
  for (const child of node.content ?? []) {
    const text = nodeText(child)
    if (text.length === 0) continue
    // block children sit on their own line, inline children flow together
    if (parts.length > 0 && blockTypes.has(child.type)) parts.push('\n')
    parts.push(text)
  }
  return parts.join('')
}

export function richContentToPlainText(doc: RichContentDoc): string {
  return nodeText(doc).trim()
}

export function pageContentToPlainText(content: string): string {
  const doc = parseRichContent(content)
  return doc ? richContentToPlainText(doc) : content
}

// Agents

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Agent = z.infer<typeof AgentSchema>

export const CreateAgentInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  instructions: z.string().max(10000).optional()
})

export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>

export const UpdateAgentInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  instructions: z.string().max(10000).optional()
})

export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>

// Responses

export const SearchResponseSchema = z.object({
  spaces: z.array(SpaceSchema),
  pages: z.array(PageTreeNodeSchema.extend({ spaceName: z.string() })),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>

// Chat (Phase 3)

export const ThreadSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Thread = z.infer<typeof ThreadSchema>

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: z.number()
})

export type Message = z.infer<typeof MessageSchema>

export const CreateThreadInputSchema = z.object({
  agentId: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional()
})

export type CreateThreadInput = z.infer<typeof CreateThreadInputSchema>

export const SendMessageInputSchema = z.object({
  threadId: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().trim().min(1)
})

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>

// Tools (Phase 4)

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  command: z.string(),
  args: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Tool = z.infer<typeof ToolSchema>

export const CreateToolInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  command: z.string().trim().min(1),
  args: z.string().optional()
})

export type CreateToolInput = z.infer<typeof CreateToolInputSchema>

export const ToolCallSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  arguments: z.string(),
  status: z.enum(['pending', 'approved', 'denied', 'executed', 'failed']),
  result: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type ToolCall = z.infer<typeof ToolCallSchema>

export const CreateToolCallInputSchema = z.object({
  toolId: z.string().min(1),
  arguments: z.string().trim().min(1)
})

export type CreateToolCallInput = z.infer<typeof CreateToolCallInputSchema>

export const ApproveToolCallInputSchema = z.object({
  approved: z.boolean()
})

export type ApproveToolCallInput = z.infer<typeof ApproveToolCallInputSchema>

// Sandbox (Phase 5)

export const SandboxSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Sandbox = z.infer<typeof SandboxSchema>

export const CreateSandboxInputSchema = z.object({
  name: z.string().trim().min(1).max(200)
})

export type CreateSandboxInput = z.infer<typeof CreateSandboxInputSchema>

