/**
 * tools/FileWriteTool/index.ts - 文件写入工具
 *
 * 对应真实 Claude Code: src/tools/FileWriteTool/
 * 真实版本还包含：文件备份、权限检查、符号链接安全、
 * 大文件警告等。我们实现核心写入功能。
 */

import { buildTool } from "../../Tool.js";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export const FileWriteTool = buildTool({
  name: "Write",
  description: "将内容写入指定文件。如果文件不存在会自动创建（包括中间目录）。如果文件已存在会覆盖。",
  inputSchema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "文件的绝对路径" },
      content: { type: "string", description: "要写入的完整文件内容" },
    },
    required: ["file_path", "content"],
  },
  isReadOnly: false,
  async call(input) {
    const filePath = String(input.file_path);
    const content = String(input.content);

    try {
      // 确保目录存在
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const existed = existsSync(filePath);
      await Bun.write(filePath, content);

      const lines = content.split("\n").length;
      const bytes = new TextEncoder().encode(content).length;
      const action = existed ? "Updated" : "Created";

      return {
        content: `${action} ${filePath} (${lines} lines, ${bytes} bytes)`,
      };
    } catch (e) {
      return { content: `Error writing file: ${e}`, isError: true };
    }
  },
});
