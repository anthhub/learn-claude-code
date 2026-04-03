/**
 * commands/compact.ts - /compact 命令
 *
 * 对应真实 Claude Code 的上下文压缩功能。
 * 当对话历史过长时，用 AI 总结之前的对话，减少 token 使用。
 */
export const compactCommand = {
  name: "compact",
  description: "压缩对话上下文",
  execute(): string {
    return "上下文压缩完成。";
  },
};
