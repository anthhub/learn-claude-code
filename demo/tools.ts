/**
 * tools.ts - 工具注册表
 *
 * 对应真实 Claude Code: src/tools.ts
 *
 * 工具注册表是所有可用工具的中央索引。
 * QueryEngine 在调用 API 时，将注册表中的工具转换为 API 参数格式；
 * 收到 tool_use 响应时，根据名称在注册表中查找并执行工具。
 *
 * 真实 Claude Code 在此文件中导入 40+ 个工具，
 * 并通过 feature() 宏条件加载。我们先注册几个示例工具。
 */

import type { Tool, APIToolDefinition } from "./types/index.js";
import { toolToAPIFormat } from "./types/index.js";
import { buildTool } from "./Tool.js";

// ─── 内置工具定义 ──────────────────────────────────────────────────────────
// 第 5 章会将这些移到独立的 tools/ 目录中
// 目前先在这里定义简单版本，验证注册表机制

/**
 * EchoTool - 最简单的工具，用于验证工具系统
 *
 * 这不是真实 Claude Code 中的工具，只是教学用的 hello world
 */
const EchoTool = buildTool({
  name: "Echo",
  description: "回显输入内容，用于测试工具系统是否正常工作",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "要回显的消息" },
    },
    required: ["message"],
  },
  isReadOnly: true,
  async call(input) {
    return { content: String(input.message) };
  },
});

/**
 * ReadTool - 读取文件内容（简化版）
 *
 * 对应真实 Claude Code: src/tools/FileReadTool/
 * 第 5 章会实现完整版本（支持行号范围、二进制文件检测等）
 */
const ReadTool = buildTool({
  name: "Read",
  description: "读取指定文件的内容",
  inputSchema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "文件的绝对路径" },
    },
    required: ["file_path"],
  },
  isReadOnly: true,
  async call(input) {
    try {
      const filePath = String(input.file_path);
      const file = Bun.file(filePath);
      const content = await file.text();
      return { content };
    } catch (e) {
      return { content: `Error reading file: ${e}`, isError: true };
    }
  },
});

/**
 * BashTool - 执行 shell 命令（简化版）
 *
 * 对应真实 Claude Code: src/tools/BashTool/
 * 第 5 章会实现完整版本（支持超时、工作目录、信号处理等）
 */
const BashTool = buildTool({
  name: "Bash",
  description: "执行 shell 命令并返回输出",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "要执行的 shell 命令" },
    },
    required: ["command"],
  },
  isReadOnly: false, // shell 命令可能有副作用
  async call(input) {
    try {
      const proc = Bun.spawn(["sh", "-c", String(input.command)], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      let content = stdout;
      if (stderr) content += `\nSTDERR:\n${stderr}`;
      if (exitCode !== 0) content += `\nExit code: ${exitCode}`;

      return { content, isError: exitCode !== 0 };
    } catch (e) {
      return { content: `Error executing command: ${e}`, isError: true };
    }
  },
});

/**
 * GrepTool - 搜索文件内容（简化版）
 *
 * 对应真实 Claude Code: src/tools/GrepTool/
 * 底层使用 ripgrep，这里简化为调用 grep 命令
 */
const GrepTool = buildTool({
  name: "Grep",
  description: "在文件中搜索匹配的文本模式",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "搜索的正则表达式" },
      path: { type: "string", description: "搜索的目录或文件路径" },
    },
    required: ["pattern"],
  },
  isReadOnly: true,
  async call(input) {
    try {
      const pattern = String(input.pattern);
      const searchPath = String(input.path ?? ".");
      const proc = Bun.spawn(
        ["grep", "-rn", "--include=*.ts", "--include=*.js", pattern, searchPath],
        { stdout: "pipe", stderr: "pipe" }
      );
      const stdout = await new Response(proc.stdout).text();
      await proc.exited;
      return { content: stdout || "No matches found." };
    } catch (e) {
      return { content: `Error: ${e}`, isError: true };
    }
  },
});

// ─── 工具注册表 ──────────────────────────────────────────────────────────────

/**
 * 所有已注册的工具
 *
 * 真实 Claude Code 中，这个数组包含 40+ 个工具，
 * 部分工具通过 feature() 宏条件加载。
 * 后续章节会逐步添加更多工具。
 */
export const allTools: Tool[] = [
  EchoTool,
  ReadTool,
  BashTool,
  GrepTool,
];

/**
 * 根据名称查找工具
 *
 * 对应真实 Claude Code: findToolByName()
 * 真实版本还支持别名查找（tool.aliases）
 */
export function findToolByName(name: string): Tool | undefined {
  return allTools.find((t) => t.name === name);
}

/**
 * 将所有工具转换为 API 格式
 *
 * 在调用 Anthropic Messages API 时，需要将工具列表
 * 转换为 API 接受的 { name, description, input_schema } 格式
 */
export function getToolsForAPI(): APIToolDefinition[] {
  return allTools.map(toolToAPIFormat);
}

// 导出各个工具（供直接引用或测试）
export { EchoTool, ReadTool, BashTool, GrepTool };
