/**
 * context.ts - 系统提示词构建器
 *
 * 对应真实 Claude Code 的系统提示词构建逻辑
 *
 * 系统提示词告诉 AI "你是谁、能做什么、有什么规则"。
 * Claude Code 的系统提示词包含工具描述、工作目录、安全规则等。
 * 我们构建一个简化版本。
 */

import type { Tool } from "./types/index.js";

/**
 * 构建系统提示词
 *
 * 真实 Claude Code 的系统提示词有数千 token，包含：
 * - 身份描述（你是 Claude Code，一个 AI 编程助手）
 * - 可用工具列表和使用说明
 * - 工作目录信息
 * - 安全规则
 * - 输出格式要求
 *
 * 我们的简化版保留核心结构。
 */
export function buildSystemPrompt(tools: Tool[], cwd: string): string {
  const toolDescriptions = tools
    .map((t) => {
      const params = Object.entries(t.inputSchema.properties)
        .map(([name, prop]) => `    - ${name}: ${prop.description ?? prop.type}`)
        .join("\n");
      return `- **${t.name}**: ${t.description}\n  Parameters:\n${params}`;
    })
    .join("\n\n");

  return `You are mini-claude, an AI coding assistant running in the terminal.
You help users with software engineering tasks by reading files, running commands, and searching code.

# Working Directory
${cwd}

# Available Tools
You have access to the following tools. Use them when needed to accomplish tasks:

${toolDescriptions}

# Rules
- Always use tools to gather information before answering questions about code
- Be concise and direct in your responses
- When editing files, show the changes you're making
- If a command might be dangerous, explain what it does before running it
`;
}
