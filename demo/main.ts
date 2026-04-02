/**
 * main.ts - mini-claude 入口文件
 *
 * 对应真实 Claude Code: src/main.tsx
 *
 * 当前状态（第 1 章）：仅验证类型系统可正常工作
 * 后续章节会逐步添加：
 *   第 2 章: Tool 接口实现 + 工具注册表
 *   第 3 章: Anthropic API 调用 + 流式响应
 *   第 4 章: 查询循环（Agentic Loop）
 *   ...
 */

import {
  generateId,
  isToolUseBlock,
  isTextBlock,
  toolToAPIFormat,
  DEFAULT_MODEL,
  DEFAULT_CONFIG,
} from "./types/index.js";

import type {
  Message,
  UserMessage,
  AssistantMessage,
  ContentBlock,
  Tool,
  AppConfig,
  PermissionRule,
  PermissionContext,
  PermissionDecision,
} from "./types/index.js";

// ─── 验证类型系统 ────────────────────────────────────────────────────────────

// 构造一条用户消息
const userMsg: UserMessage = {
  type: "user",
  uuid: generateId(),
  message: {
    role: "user",
    content: "帮我看一下 main.ts 的内容",
  },
};

// 构造一条助手消息（模拟 AI 回复，包含工具调用）
const assistantMsg: AssistantMessage = {
  type: "assistant",
  uuid: generateId(),
  message: {
    role: "assistant",
    content: [
      { type: "text", text: "好的，让我读取这个文件。" },
      {
        type: "tool_use",
        id: "tool_001",
        name: "Read",
        input: { file_path: "main.ts" },
      },
    ],
    model: DEFAULT_CONFIG.model,
    stop_reason: "tool_use",
  },
};

// 从助手消息中提取工具调用
const toolCalls = assistantMsg.message.content.filter(isToolUseBlock);

// 模拟一个工具定义
const readTool: Tool = {
  name: "Read",
  description: "读取文件内容",
  inputSchema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "文件的绝对路径" },
    },
    required: ["file_path"],
  },
  isReadOnly: true,
  async call(input) {
    return { content: `[文件内容: ${input.file_path}]` };
  },
};

// 转换为 API 格式
const apiTool = toolToAPIFormat(readTool);

// 构建消息历史
const messages: Message[] = [userMsg, assistantMsg];

// ─── 验证权限系统 ──────────────────────────────────────────────────────────

// 定义权限规则
const permissionRules: PermissionRule[] = [
  { toolName: "Read", behavior: "allow", source: "default", reason: "只读操作无风险" },
  { toolName: "Bash", pattern: "rm -rf", behavior: "deny", source: "default", reason: "危险的删除操作" },
  { toolName: "Bash", behavior: "ask", source: "default", reason: "Shell 命令可能有副作用" },
];

// 构建权限上下文
const permissionCtx: PermissionContext = {
  mode: "default",
  cwd: process.cwd(),
  rules: permissionRules,
};

// 简单的权限检查函数（模拟真实 Claude Code 的 canUseTool）
function checkPermission(
  toolName: string,
  input: Record<string, unknown>,
  rules: PermissionRule[]
): PermissionDecision {
  for (const rule of rules) {
    if (rule.toolName !== "*" && rule.toolName !== toolName) continue;
    if (rule.pattern) {
      const command = String(input.command ?? "");
      if (!command.includes(rule.pattern)) continue;
    }
    if (rule.behavior === "allow") return { behavior: "allow" };
    if (rule.behavior === "deny") return { behavior: "deny", message: rule.reason ?? "Denied" };
    return { behavior: "ask", message: rule.reason ?? "需要确认" };
  }
  return { behavior: "ask", message: "默认需要确认" };
}

// 测试权限检查
const permTests = [
  { tool: "Read", input: { file_path: "main.ts" } },
  { tool: "Bash", input: { command: "ls -la" } },
  { tool: "Bash", input: { command: "rm -rf /" } },
];

// ─── 输出验证结果 ─────────────────────────────────────────────────────────

console.log("mini-claude - 类型系统验证");
console.log("=".repeat(40));
console.log();
console.log(`消息历史: ${messages.length} 条`);
console.log(`  用户消息: "${typeof userMsg.message.content === "string" ? userMsg.message.content : "[复合内容]"}"`);
console.log(`  助手消息: ${assistantMsg.message.content.length} 个内容块`);
console.log(`  工具调用: ${toolCalls.length} 个`);
toolCalls.forEach((tc) => {
  console.log(`    → ${tc.name}(${JSON.stringify(tc.input)})`);
});
console.log();
console.log(`注册工具: ${apiTool.name}`);
console.log(`  描述: ${apiTool.description}`);
console.log(`  参数: ${JSON.stringify(apiTool.input_schema.properties)}`);
console.log(`  只读: ${readTool.isReadOnly}`);
console.log();
console.log(`默认配置:`);
console.log(`  模型: ${DEFAULT_CONFIG.model}`);
console.log(`  最大 Token: ${DEFAULT_CONFIG.maxTokens}`);
console.log(`  权限模式: ${DEFAULT_CONFIG.permissionMode}`);
console.log();
console.log(`权限系统 (模式: ${permissionCtx.mode}):`);
permTests.forEach((tc) => {
  const decision = checkPermission(tc.tool, tc.input, permissionCtx.rules);
  const icon = decision.behavior === "allow" ? "✅" : decision.behavior === "deny" ? "🚫" : "❓";
  const cmd = (tc.input.command ?? tc.input.file_path) as string;
  console.log(`  ${icon} ${tc.tool}("${cmd}") → ${decision.behavior}`);
});
console.log();
console.log("类型系统验证通过！");
console.log("下一步: 第 2 章 - 实现 Tool 接口和工具注册表");
