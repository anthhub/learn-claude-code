/**
 * tools/GlobTool/index.ts - 文件路径匹配工具
 *
 * 对应真实 Claude Code: src/tools/GlobTool/
 * 用于快速发现文件，如 "**\/*.ts" 找到所有 TypeScript 文件。
 * 使用 Bun.Glob 实现。
 */

import { buildTool } from "../../Tool.js";
import { Glob } from "bun";

export const GlobTool = buildTool({
  name: "Glob",
  description: "使用 glob 模式查找匹配的文件路径。如 '**/*.ts' 查找所有 TypeScript 文件。结果按路径排序。",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob 模式，如 '**/*.ts'、'src/**/*.js'" },
      path: { type: "string", description: "搜索的根目录，默认当前目录" },
    },
    required: ["pattern"],
  },
  isReadOnly: true,
  async call(input) {
    const pattern = String(input.pattern);
    const searchPath = String(input.path ?? ".");

    try {
      const glob = new Glob(pattern);
      const matches: string[] = [];

      for await (const file of glob.scan({ cwd: searchPath, dot: false })) {
        matches.push(file);
        if (matches.length >= 1000) break; // 限制结果数量
      }

      matches.sort();

      if (matches.length === 0) {
        return { content: "No files matched the pattern." };
      }

      let content = matches.join("\n");
      if (matches.length >= 1000) {
        content += "\n... [results limited to 1000 files]";
      }

      return { content: `Found ${matches.length} files:\n${content}` };
    } catch (e) {
      return { content: `Error: ${e}`, isError: true };
    }
  },
});
