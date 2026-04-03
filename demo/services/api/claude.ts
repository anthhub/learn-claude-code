/**
 * services/api/claude.ts - Anthropic API 客户端
 *
 * 对应真实 Claude Code: src/services/api/claude.ts
 *
 * 封装与 Anthropic Messages API 的所有通信。
 * 核心功能：创建客户端、发送流式请求、解析流式事件。
 */

import Anthropic from "@anthropic-ai/sdk";
import type { APIToolDefinition } from "../../types/index.js";

// ─── 客户端创建 ─────────────────────────────────────────────────────────────

/**
 * 创建 Anthropic API 客户端
 *
 * 真实 Claude Code 支持多种 Provider（Anthropic、Bedrock、Vertex），
 * 这里简化为只支持 Anthropic 直连。
 */
export function createClient(apiKey?: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
  });
}

// ─── 流式消息请求 ─────────────────────────────────────────────────────────

/**
 * 流式响应事件类型
 */
export interface StreamEvent {
  type: "text" | "tool_use_start" | "tool_use_delta" | "tool_use_end" | "message_end";
  // text 事件
  text?: string;
  // tool_use 事件
  toolUseId?: string;
  toolName?: string;
  inputDelta?: string;
  // message_end 事件
  stopReason?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

/**
 * 消息请求参数
 */
export interface MessageRequest {
  model: string;
  maxTokens: number;
  system: string;
  messages: Anthropic.MessageParam[];
  tools?: APIToolDefinition[];
}

/**
 * 发送流式消息请求
 *
 * 使用 AsyncGenerator 逐个 yield 流式事件。
 * 这是真实 Claude Code 的核心模式——用 generator 让调用方
 * 可以实时处理每一个事件（渲染文字、启动工具等）。
 *
 * @example
 * for await (const event of streamMessage(client, request)) {
 *   if (event.type === "text") process.stdout.write(event.text);
 * }
 */
export async function* streamMessage(
  client: Anthropic,
  request: MessageRequest
): AsyncGenerator<StreamEvent> {
  const stream = client.messages.stream({
    model: request.model,
    max_tokens: request.maxTokens,
    system: request.system,
    messages: request.messages,
    tools: request.tools as Anthropic.Tool[],
  });

  // 累积工具调用的 JSON 输入（流式分片到达）
  const toolInputBuffers = new Map<number, { id: string; name: string; input: string }>();

  for await (const event of stream) {
    switch (event.type) {
      case "content_block_start": {
        const block = event.content_block;
        if (block.type === "tool_use") {
          toolInputBuffers.set(event.index, {
            id: block.id,
            name: block.name,
            input: "",
          });
          yield {
            type: "tool_use_start",
            toolUseId: block.id,
            toolName: block.name,
          };
        }
        break;
      }

      case "content_block_delta": {
        const delta = event.delta;
        if (delta.type === "text_delta") {
          yield { type: "text", text: delta.text };
        } else if (delta.type === "input_json_delta") {
          const buf = toolInputBuffers.get(event.index);
          if (buf) buf.input += delta.partial_json;
          yield {
            type: "tool_use_delta",
            inputDelta: delta.partial_json,
          };
        }
        break;
      }

      case "content_block_stop": {
        const buf = toolInputBuffers.get(event.index);
        if (buf) {
          yield {
            type: "tool_use_end",
            toolUseId: buf.id,
            toolName: buf.name,
            inputDelta: buf.input, // 完整的 JSON 字符串
          };
          toolInputBuffers.delete(event.index);
        }
        break;
      }

      case "message_stop": {
        break;
      }
    }
  }

  // 获取最终消息以提取 usage 和 stop_reason
  const finalMessage = await stream.finalMessage();
  yield {
    type: "message_end",
    stopReason: finalMessage.stop_reason ?? undefined,
    usage: {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    },
  };
}

/**
 * 发送非流式消息请求（简单版本）
 *
 * 用于不需要实时展示的场景，如上下文压缩
 */
export async function sendMessage(
  client: Anthropic,
  request: MessageRequest
): Promise<Anthropic.Message> {
  return client.messages.create({
    model: request.model,
    max_tokens: request.maxTokens,
    system: request.system,
    messages: request.messages,
    tools: request.tools as Anthropic.Tool[],
  });
}
