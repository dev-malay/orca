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

// Sandbox (P5)

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

