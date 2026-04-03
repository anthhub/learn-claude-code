/**
 * screens/REPL.tsx - 交互式 REPL 界面
 *
 * 对应真实 Claude Code: src/screens/REPL.tsx
 * 这是 mini-claude 的主界面：用户输入 → AI 回复 → 工具调用 → 循环。
 */

import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { MessageList } from "../components/MessageList.js";
import { query } from "../query.js";
import { allTools } from "../tools.js";
import { createPermissionContext, createCheckPermissionFn } from "../utils/permissions.js";
import { DEFAULT_MODEL } from "../types/index.js";
import type { Message, PermissionMode } from "../types/index.js";
import { tryExecuteCommand } from "../commands/index.js";
import { compactMessages } from "../services/compact/compact.js";

interface REPLProps {
  model?: string;
  maxTokens?: number;
  permissionMode?: PermissionMode;
}

export function REPL({ model: modelProp, maxTokens: maxTokensProp, permissionMode: permModeProp }: REPLProps = {}) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 });

  const activeModel = modelProp ?? DEFAULT_MODEL;
  const activeMaxTokens = maxTokensProp ?? 4096;
  const activePermMode = permModeProp ?? "auto";

  const permCtx = createPermissionContext(activePermMode);
  const checkPerm = createCheckPermissionFn(permCtx);

  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // 处理退出命令
    if (trimmed === "/exit" || trimmed === "/quit") {
      exit();
      return;
    }

    // 检查斜杠命令
    const cmdResult = tryExecuteCommand(trimmed);
    if (cmdResult !== null) {
      if (trimmed === "/clear") {
        setMessages([]);
      } else if (trimmed === "/compact") {
        setMessages((prev) => compactMessages(prev));
      }
      // 将命令结果作为系统消息显示
      setMessages((prev) => [...prev, {
        type: "system" as const,
        subtype: "local_command" as const,
        message: cmdResult,
      }]);
      setInput("");
      return;
    }

    setInput("");
    setIsLoading(true);
    setStreamText("");

    try {
      const result = await query(trimmed, [...messages], {
        model: activeModel,
        maxTokens: activeMaxTokens,
        checkPermission: checkPerm,
        onText: (text) => {
          setStreamText((prev) => prev + text);
        },
        onToolUse: (name, toolInput) => {
          setStreamText((prev) => prev + `\n🔧 ${name}(${JSON.stringify(toolInput).substring(0, 60)}...)\n`);
        },
        onToolResult: (name, _result, isError) => {
          const icon = isError ? "❌" : "✅";
          setStreamText((prev) => prev + `${icon} ${name} done\n`);
        },
      });

      setMessages(result.messages);
      setTokenUsage((prev) => ({
        input: prev.input + result.inputTokens,
        output: prev.output + result.outputTokens,
      }));
    } catch (err) {
      setStreamText(`Error: ${err}`);
    } finally {
      setIsLoading(false);
      setStreamText("");
    }
  }, [messages, checkPerm, exit]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">mini-claude</Text>
        <Text dimColor> | {activeModel} | {allTools.length} tools | tokens: {tokenUsage.input}↑ {tokenUsage.output}↓</Text>
      </Box>

      {/* Message History */}
      <MessageList messages={messages} />

      {/* Streaming Output */}
      {streamText && (
        <Box marginTop={1}>
          <Text>{streamText}</Text>
        </Box>
      )}

      {/* Loading Indicator */}
      {isLoading && !streamText && (
        <Text color="yellow">⏳ Thinking...</Text>
      )}

      {/* Input */}
      <Box marginTop={1}>
        <Text bold color="blue">{"❯ "}</Text>
        {isLoading ? (
          <Text dimColor>(waiting for response...)</Text>
        ) : (
          <TextInputFallback value={input} onChange={setInput} onSubmit={handleSubmit} />
        )}
      </Box>

      {/* Help */}
      <Box marginTop={1}>
        <Text dimColor>Type your question. /exit to quit.</Text>
      </Box>
    </Box>
  );
}

/**
 * 简单的文本输入组件（不依赖 ink-text-input）
 * 使用 useInput 手动处理按键
 */
function TextInputFallback({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}) {
  useInput((ch, key) => {
    if (key.return) {
      onSubmit(value);
      return;
    }
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }
    if (ch && !key.ctrl && !key.meta) {
      onChange(value + ch);
    }
  });

  return (
    <Text>
      {value}
      <Text backgroundColor="white"> </Text>
    </Text>
  );
}
