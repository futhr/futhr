// Minimal typing for the WebMCP proposal (https://webmachinelearning.github.io/webmcp/).
// Kept local and narrow so the site does not depend on a package for an API that is
// still an origin trial and may change shape.

interface ModelContextToolContent {
  type: 'text'
  text: string
}

interface ModelContextToolResult {
  content: ModelContextToolContent[]
  isError?: boolean
}

interface ModelContextTool {
  name: string
  description: string
  inputSchema?: Record<string, unknown>
  execute: (
    input: Record<string, unknown>
  ) => ModelContextToolResult | Promise<ModelContextToolResult>
}

interface ModelContextRegisterOptions {
  signal?: AbortSignal
}

interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: ModelContextRegisterOptions) => Promise<void>
}

interface Document {
  modelContext?: ModelContext
}
