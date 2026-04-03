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

import { createClient, streamMessage } from "./services/api/claude.js";
import { buildSystemPrompt } from "./context.js";

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

import { buildTool } from "./Tool.js";
import { allTools, findToolByName, getToolsForAPI } from "./tools.js";

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
console.log(`工具注册表: ${allTools.length} 个工具`);
allTools.forEach((tool) => {
  const ro = tool.isReadOnly ? "只读" : "读写";
  console.log(`  ${tool.name.padEnd(8)} [${ro}] ${tool.description}`);
});
console.log();

// 测试工具查找
const found = findToolByName("Read");
console.log(`查找工具 "Read": ${found ? "✅ 找到" : "❌ 未找到"}`);
const notFound = findToolByName("NotExist");
console.log(`查找工具 "NotExist": ${notFound ? "✅ 找到" : "❌ 未找到"}`);
console.log();

// 展示 API 格式
const apiTools = getToolsForAPI();
console.log(`API 工具格式: ${apiTools.length} 个工具定义`);
apiTools.forEach((t) => {
  const params = Object.keys(t.input_schema.properties).join(", ");
  console.log(`  ${t.name}(${params})`);
});
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
// 实际执行工具
console.log();
console.log("工具执行测试:");
const echoResult = await findToolByName("Echo")!.call({ message: "Hello mini-claude!" });
console.log(`  Echo: "${echoResult.content}"`);

const bashResult = await findToolByName("Bash")!.call({ command: "echo 'tool system works!'" });
console.log(`  Bash: "${bashResult.content.trim()}"`);

console.log();
console.log("类型系统验证通过！");

// ─── 第 3 章：API 服务层演示 ──────────────────────────────────────────────

// 构建系统提示词
const systemPrompt = buildSystemPrompt(allTools, process.cwd());
console.log("系统提示词预览（前 200 字符）:");
console.log(`  "${systemPrompt.substring(0, 200)}..."`);
console.log();

// API 客户端演示（需要 ANTHROPIC_API_KEY 环境变量）
if (process.env.ANTHROPIC_API_KEY) {
  console.log("API 流式调用演示:");
  const client = createClient();
  const apiToolDefs = getToolsForAPI();

  process.stdout.write("  AI: ");
  for await (const event of streamMessage(client, {
    model: DEFAULT_MODEL,
    maxTokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: "Say hello in one sentence." }],
    tools: apiToolDefs,
  })) {
    if (event.type === "text") {
      process.stdout.write(event.text ?? "");
    } else if (event.type === "message_end") {
      console.log();
      console.log(`  [tokens: ${event.usage?.inputTokens} in, ${event.usage?.outputTokens} out]`);
    }
  }
} else {
  console.log("API 演示跳过（设置 ANTHROPIC_API_KEY 环境变量后可体验流式调用）");
}

console.log();
console.log("下一步: 第 4 章 - 查询循环（Agentic Loop）");
