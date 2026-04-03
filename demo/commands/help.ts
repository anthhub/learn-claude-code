/**
 * commands/help.ts - /help 命令
 */
export const helpCommand = {
  name: "help",
  description: "显示帮助信息",
  execute(): string {
    return `mini-claude 可用命令:
  /help     — 显示此帮助信息
  /clear    — 清空对话历史
  /compact  — 压缩对话上下文
  /exit     — 退出程序

可用工具: Echo, Read, Write, Edit, Bash, Grep, Glob`;
  },
};
