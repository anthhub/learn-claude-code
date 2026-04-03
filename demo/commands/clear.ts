/**
 * commands/clear.ts - /clear 命令
 */
export const clearCommand = {
  name: "clear",
  description: "清空对话历史",
  execute(): string {
    return "对话历史已清空。";
  },
};
