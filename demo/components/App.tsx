/**
 * components/App.tsx - 应用入口组件
 *
 * 检查 API key，决定渲染 REPL 还是错误提示。
 */

import React from "react";
import { Box, Text } from "ink";
import { REPL } from "../screens/REPL.js";

export function App() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">Missing API Key</Text>
        <Text>Set ANTHROPIC_API_KEY environment variable to use mini-claude:</Text>
        <Text color="cyan">  ANTHROPIC_API_KEY=sk-ant-xxx bun run start</Text>
      </Box>
    );
  }

  return <REPL />;
}
