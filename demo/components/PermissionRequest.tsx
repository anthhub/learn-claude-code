/**
 * components/PermissionRequest.tsx - 权限确认对话框
 *
 * 对应真实 Claude Code: src/components/PermissionRequest/
 * 当工具需要 ask 权限时，显示确认对话框让用户选择。
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface Props {
  toolName: string;
  input: Record<string, unknown>;
  message: string;
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionRequest({ toolName, input, message, onAllow, onDeny }: Props) {
  const [selected, setSelected] = useState<"allow" | "deny">("allow");

  useInput((_, key) => {
    if (key.leftArrow || key.rightArrow) {
      setSelected((prev) => (prev === "allow" ? "deny" : "allow"));
    }
    if (key.return) {
      if (selected === "allow") onAllow();
      else onDeny();
    }
  });

  const inputStr = JSON.stringify(input).substring(0, 80);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">⚠ Permission Required</Text>
      <Text>Tool: <Text bold>{toolName}</Text></Text>
      <Text dimColor>Input: {inputStr}</Text>
      <Text>Reason: {message}</Text>
      <Box gap={2} marginTop={1}>
        <Text
          backgroundColor={selected === "allow" ? "green" : undefined}
          color={selected === "allow" ? "white" : "green"}
        >
          {selected === "allow" ? " ✓ Allow " : "  Allow  "}
        </Text>
        <Text
          backgroundColor={selected === "deny" ? "red" : undefined}
          color={selected === "deny" ? "white" : "red"}
        >
          {selected === "deny" ? " ✗ Deny " : "  Deny  "}
        </Text>
      </Box>
      <Text dimColor>← → to select, Enter to confirm</Text>
    </Box>
  );
}
