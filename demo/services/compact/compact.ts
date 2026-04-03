/**
 * services/compact/compact.ts - 上下文压缩
 *
 * 对应真实 Claude Code 的上下文压缩功能。
 * 当对话历史超过 token 限制时，用 AI 总结历史对话。
 *
 * 简化版：用截断替代 AI 总结（真实版本调用 API 做总结）。
 */

import type { Message, SystemMessage } from "../../types/index.js";

/**
 * 压缩消息历史
 *
 * 策略：保留最近 N 条消息，之前的用摘要替代。
 * 真实 Claude Code 会调用 API 生成摘要。
 */
export function compactMessages(
  messages: Message[],
  keepRecent: number = 6
): Message[] {
  if (messages.length <= keepRecent) return messages;

  const removed = messages.length - keepRecent;
  const summary: SystemMessage = {
    type: "system",
    subtype: "compact_boundary",
    message: `[上下文已压缩：省略了前 ${removed} 条消息]`,
  };

  return [summary, ...messages.slice(-keepRecent)];
}

/**
 * 估算消息的 token 数（粗略）
 * 真实 Claude Code 使用 tiktoken 精确计算
 */
export function estimateTokens(messages: Message[]): number {
  let chars = 0;
  for (const msg of messages) {
    if (msg.type === "user") {
      const content = msg.message.content;
      if (typeof content === "string") chars += content.length;
      else chars += JSON.stringify(content).length;
    } else if (msg.type === "assistant") {
      chars += JSON.stringify(msg.message.content).length;
    }
  }
  return Math.ceil(chars / 4); // 粗略估算：4 字符 ≈ 1 token
}
