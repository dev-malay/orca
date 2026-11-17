import type {
  CreatePageInput,
  Page,
  PageTreeNode,
  SearchResponse,
  Space,
  UpdatePageContentInput,
  UpdatePageInput,
} from '@repo/shared'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type SaveContentResult =
  | { ok: true; page: Page }
  | { ok: false; conflict: Page }
  | { ok: false; error: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body !== undefined ? { 'content-type': 'application/json' } : undefined,
  })
  if (res.status === 204) return undefined as T
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`)
  }
  return body as T
}

export const api = {
  listSpaces: () => request<Space[]>('/api/spaces'),
  createSpace: (name: string) =>
    request<Space>('/api/spaces', { method: 'POST', body: JSON.stringify({ name }) }),
  renameSpace: (id: string, name: string) =>
    request<Space>(`/api/spaces/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteSpace: (id: string) => request<void>(`/api/spaces/${id}`, { method: 'DELETE' }),

  listPages: (spaceId: string) => request<PageTreeNode[]>(`/api/spaces/${spaceId}/pages`),
  createPage: (spaceId: string, input: CreatePageInput = {}) =>
    request<Page>(`/api/spaces/${spaceId}/pages`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getPage: (id: string) => request<Page>(`/api/pages/${id}`),
  updatePage: (id: string, input: UpdatePageInput) =>
    request<Page>(`/api/pages/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deletePage: (id: string) => request<void>(`/api/pages/${id}`, { method: 'DELETE' }),

  // 409 is a normal outcome here (another window saved first), so it comes
  // back as a result instead of throwing
  savePageContent: async (id: string, input: UpdatePageContentInput): Promise<SaveContentResult> => {
    const res = await fetch(`/api/pages/${id}/content`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    const body = (await res.json().catch(() => null)) as { error?: string; page?: Page } | null
    if (res.ok && body?.page) return { ok: true, page: body.page }
    if (res.status === 409 && body?.page) return { ok: false, conflict: body.page }
    return { ok: false, error: body?.error ?? `Save failed with status ${res.status}` }
  },

  search: (q: string) => request<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`),
}
