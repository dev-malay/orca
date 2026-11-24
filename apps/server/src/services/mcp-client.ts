import { Client } from '@modelcontextprotocol/sdk/client'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio'

export interface McpServerConfig {
  id: string
  name: string
  command: string
  args: string[]
}

export interface McpTool {
  name: string
  description: string
  inputSchema: unknown
}

const clients = new Map<string, Client>()

export function listMcpServers(): McpServerConfig[] {
  return []
}

export function addMcpServer(config: McpServerConfig): void {
  if (clients.has(config.id)) return
  const client = new Client({ name: 'orca', version: '1.0.0' })
  const transport = new StdioClientTransport({ command: config.command, args: config.args })
  clients.set(config.id, client)
  void client.connect(transport).catch(() => {
    clients.delete(config.id)
  })
}

export async function listMcpTools(serverId: string): Promise<McpTool[]> {
  const client = clients.get(serverId)
  if (!client) return []
  const result = await client.listTools()
  return result.tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? '',
    inputSchema: tool.inputSchema ?? {}
  }))
}

export async function callMcpTool(serverId: string, toolName: string, argumentsValue: unknown): Promise<unknown> {
  const client = clients.get(serverId)
  if (!client) throw new Error('MCP server not connected')
  const result = await client.callTool({ name: toolName, arguments: argumentsValue as Record<string, unknown> | undefined })
  return result as unknown
}

export function removeMcpServer(serverId: string): void {
  const client = clients.get(serverId)
  if (client) {
    void client.close()
  }
  clients.delete(serverId)
}
