/**
 * components/App.tsx - 应用入口组件
 *
 * 检查 API key，决定渲染 REPL 还是错误提示。
 */

import React from "react";
import { Box, Text } from "ink";
import { REPL } from "../screens/REPL.js";
import type { PermissionMode } from "../types/index.js";

interface AppProps {
  model?: string;
  maxTokens?: number;
  permissionMode?: PermissionMode;
}

export function App({ model, maxTokens, permissionMode }: AppProps) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">Missing API Key</Text>
        <Text>Set ANTHROPIC_API_KEY environment variable to use mini-claude:</Text>
        <Text color="cyan">  ANTHROPIC_API_KEY=sk-ant-xxx bun run start</Text>
      </Box>
    );
  }

  return <REPL model={model} maxTokens={maxTokens} permissionMode={permissionMode} />;
}
