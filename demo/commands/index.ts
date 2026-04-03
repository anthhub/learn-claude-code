/**
 * commands/index.ts - 命令注册表
 *
 * 对应真实 Claude Code: src/commands.ts
 * 管理所有斜杠命令的注册和查找。
 */

import { helpCommand } from "./help.js";
import { clearCommand } from "./clear.js";
import { compactCommand } from "./compact.js";

export interface SlashCommand {
  name: string;
  description: string;
  execute(args?: string): string;
}

export const commands: SlashCommand[] = [
  helpCommand,
  clearCommand,
  compactCommand,
];

export function findCommand(name: string): SlashCommand | undefined {
  return commands.find((c) => c.name === name);
}

/**
 * 检查输入是否为斜杠命令，如果是则执行
 * @returns 命令输出，或 null 表示不是命令
 */
export function tryExecuteCommand(input: string): string | null {
  if (!input.startsWith("/")) return null;

  const parts = input.slice(1).split(/\s+/);
  const cmdName = parts[0];
  const args = parts.slice(1).join(" ");

  const cmd = findCommand(cmdName);
  if (!cmd) return `未知命令: /${cmdName}。输入 /help 查看可用命令。`;

  return cmd.execute(args);
}
