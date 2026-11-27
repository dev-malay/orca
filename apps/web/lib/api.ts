export type Page = {
  id: string
  spaceId: string
  parentId: string | null
  title: string
  updatedAt: number
  content: string
  revision: number
  createdAt: number
}

export type Space = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type SpacePage = Page & { spaceName: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body !== undefined ? { 'content-type': 'application/json' } : undefined,
  })
  if (res.status === 204) return undefined as T
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }
  return body as T
}

export const api = {
  listSpaces: () => request<Space[]>('/api/spaces'),
  createSpace: (name: string) =>
    request<Space>('/api/spaces', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteSpace: (id: string) => request<void>(`/api/spaces/${id}`, { method: 'DELETE' }),

  listPages: (spaceId: string) => request<SpacePage[]>(`/api/spaces/${spaceId}/pages`),
  createPage: (spaceId: string, input: { parentId?: string | null; title?: string }) =>
    request<Page>(`/api/spaces/${spaceId}/pages`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getPage: (id: string) => request<Page>(`/api/pages/${id}`),
  updatePage: (id: string, input: { title?: string }) =>
    request<Page>(`/api/pages/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deletePage: (id: string) => request<void>(`/api/pages/${id}`, { method: 'DELETE' }),

  savePageContent: (id: string, content: string, baseRevision: number) =>
    request<Page>(`/api/pages/${id}/content`, {
      method: 'PUT',
      body: JSON.stringify({ content, baseRevision }),
    }),

  search: (q: string) => request<{ spaces: Space[]; pages: SpacePage[] }>(`/api/search?q=${encodeURIComponent(q)}`),
}
