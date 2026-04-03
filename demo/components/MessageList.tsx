/**
 * components/MessageList.tsx - 消息列表组件
 *
 * 对应真实 Claude Code: src/components/AssistantMessage/ + src/components/ToolResult/
 * 渲染完整的对话历史：用户消息、AI 回复、工具调用结果。
 */

import React from "react";
import { Box, Text } from "ink";
import type { Message } from "../types/index.js";

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <Box flexDirection="column" gap={1}>
      {messages.map((msg, i) => (
        <MessageItem key={i} message={msg} />
      ))}
    </Box>
  );
}

function MessageItem({ message }: { message: Message }) {
  if (message.type === "user") {
    const content = message.message.content;
    if (typeof content === "string") {
      return (
        <Box>
          <Text bold color="blue">{"❯ "}</Text>
          <Text>{content}</Text>
        </Box>
      );
    }
    // tool_result 消息不单独渲染（已在工具调用中展示）
    return null;
  }

  if (message.type === "assistant") {
    return (
      <Box flexDirection="column">
        {message.message.content.map((block, i) => {
          if (block.type === "text") {
            return <Text key={i}>{block.text}</Text>;
          }
          if (block.type === "tool_use") {
            return (
              <Box key={i}>
                <Text dimColor>{"  🔧 "}</Text>
                <Text color="yellow">{block.name}</Text>
                <Text dimColor>({JSON.stringify(block.input).substring(0, 60)}...)</Text>
              </Box>
            );
          }
          return null;
        })}
      </Box>
    );
  }

  if (message.type === "system") {
    return (
      <Text dimColor italic>{"  ℹ "}{message.message}</Text>
    );
  }

  return null;
}
