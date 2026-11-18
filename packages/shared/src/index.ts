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

// Responses

export const SearchResponseSchema = z.object({
  spaces: z.array(SpaceSchema),
  pages: z.array(PageTreeNodeSchema.extend({ spaceName: z.string() })),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>

// forChat (P3)

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



