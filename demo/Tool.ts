/**
 * Tool.ts - 工具工厂函数
 *
 * 对应真实 Claude Code: src/Tool.ts 中的 buildTool()
 *
 * buildTool() 是一个工厂函数，接收工具定义，返回完整的 Tool 对象。
 * 它的作用是为缺失的可选字段填充安全的默认值，
 * 让开发者只需关注核心逻辑（name、description、inputSchema、call）。
 */

import type { Tool, ToolResult, JSONSchema, ToolCategory } from "./types/index.js";

/**
 * 工具定义 - 创建工具时需要提供的字段
 *
 * 必填：name, description, inputSchema, call
 * 可选：category, isReadOnly（有默认值）
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  call(input: Record<string, unknown>): Promise<ToolResult>;
  category?: ToolCategory;
  isReadOnly?: boolean;
}

/**
 * 工具默认值
 *
 * 真实 Claude Code 中叫 TOOL_DEFAULTS，包含 30+ 个默认值
 * 我们只需要最核心的几个
 */
const TOOL_DEFAULTS: Pick<Tool, "category" | "isReadOnly"> = {
  category: "builtin",
  isReadOnly: false,
};

/**
 * 构建工具
 *
 * 接收工具定义，合并默认值，返回完整的 Tool 对象。
 * 这种模式让新增工具非常简单——只需提供核心字段即可。
 *
 * @example
 * const myTool = buildTool({
 *   name: "MyTool",
 *   description: "做某件事",
 *   inputSchema: { type: "object", properties: {}, required: [] },
 *   async call(input) { return { content: "done" }; },
 * });
 */
export function buildTool(definition: ToolDefinition): Tool {
  return {
    ...TOOL_DEFAULTS,
    ...definition,
  };
}
