/**
 * utils/messages.ts - 消息转换工具函数
 *
 * 对应真实 Claude Code: src/utils/messages.ts
 *
 * 内部 Message 类型和 Anthropic API 的 MessageParam 类型之间
 * 需要转换。本模块提供这些转换函数。
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  UserMessage,
  AssistantMessage,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlock,
} from "../types/index.js";
// 注意上面是 type import，generateId 需要 value import
import { generateId as genId } from "../types/index.js";

/**
 * 将内部消息数组转换为 API 请求格式
 *
 * Anthropic API 只接受 role: "user" | "assistant" 的消息，
 * 且 tool_result 必须作为 user 消息的 content 发送。
 */
export function messagesToAPIParams(
  messages: Message[]
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.type === "user") {
      const content = msg.message.content;
      if (typeof content === "string") {
        result.push({ role: "user", content });
      } else {
        // ContentBlock[] → API format
        result.push({
          role: "user",
          content: content.map(blockToAPIParam),
        });
      }
    } else if (msg.type === "assistant") {
      result.push({
        role: "assistant",
        content: msg.message.content.map(blockToAPIParam),
      });
    }
    // SystemMessage 不发送给 API
  }

  return result;
}

/**
 * 将 ContentBlock 转换为 API 参数格式
 */
function blockToAPIParam(block: ContentBlock): Anthropic.ContentBlockParam {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "tool_use":
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: block.input,
      };
    case "tool_result":
      return {
        type: "tool_result",
        tool_use_id: block.tool_use_id,
        content: block.content,
        is_error: block.is_error,
      };
  }
}

/**
 * 创建用户消息
 */
export function createUserMessage(content: string | ContentBlock[]): UserMessage {
  return {
    type: "user",
    uuid: genId(),
    message: {
      role: "user",
      content,
    },
  };
}

/**
 * 创建助手消息
 */
export function createAssistantMessage(
  content: ContentBlock[],
  model: string,
  stopReason: "end_turn" | "tool_use" | "max_tokens" | null
): AssistantMessage {
  return {
    type: "assistant",
    uuid: genId(),
    message: {
      role: "assistant",
      content,
      model,
      stop_reason: stopReason,
    },
  };
}

/**
 * 将工具执行结果转换为 tool_result 内容块
 */
export function createToolResultBlock(
  toolUseId: string,
  content: string,
  isError?: boolean
): ToolResultBlock {
  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content,
    is_error: isError,
  };
}

/**
 * 从助手消息中提取工具调用块
 */
export function extractToolUseBlocks(msg: AssistantMessage): ToolUseBlock[] {
  return msg.message.content.filter(
    (block): block is ToolUseBlock => block.type === "tool_use"
  );
}
