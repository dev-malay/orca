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

// Tools (P4)

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

