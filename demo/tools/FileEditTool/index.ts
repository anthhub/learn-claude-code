/**
 * tools/FileEditTool/index.ts - 精确编辑工具
 *
 * 对应真实 Claude Code: src/tools/FileEditTool/
 * 核心思路：通过 old_string -> new_string 精确替换，
 * 而非整文件重写。这样 AI 只需发送 diff，节省 token。
 *
 * 真实版本还包含：模糊匹配、缩进修正、冲突检测、
 * 多处替换确认等。
 */

import { buildTool } from "../../Tool.js";

export const FileEditTool = buildTool({
  name: "Edit",
  description: "通过精确字符串替换编辑文件。指定 old_string（要替换的内容）和 new_string（替换后的内容）。old_string 必须在文件中唯一匹配。",
  inputSchema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "文件的绝对路径" },
      old_string: { type: "string", description: "要被替换的原始文本（必须唯一匹配）" },
      new_string: { type: "string", description: "替换后的新文本" },
    },
    required: ["file_path", "old_string", "new_string"],
  },
  isReadOnly: false,
  async call(input) {
    const filePath = String(input.file_path);
    const oldString = String(input.old_string);
    const newString = String(input.new_string);

    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      if (!exists) {
        return { content: `Error: File not found: ${filePath}`, isError: true };
      }

      const content = await file.text();

      // 检查 old_string 是否存在
      const index = content.indexOf(oldString);
      if (index === -1) {
        return {
          content: `Error: old_string not found in ${filePath}. Make sure the string matches exactly (including whitespace and indentation).`,
          isError: true,
        };
      }

      // 检查 old_string 是否唯一
      const secondIndex = content.indexOf(oldString, index + 1);
      if (secondIndex !== -1) {
        return {
          content: `Error: old_string matches multiple locations in ${filePath}. Provide more surrounding context to make it unique.`,
          isError: true,
        };
      }

      // 执行替换
      const newContent = content.substring(0, index) + newString + content.substring(index + oldString.length);
      await Bun.write(filePath, newContent);

      // 计算变更统计
      const oldLines = oldString.split("\n").length;
      const newLines = newString.split("\n").length;
      const diffLines = newLines - oldLines;
      const diffStr = diffLines > 0 ? `+${diffLines}` : diffLines < 0 ? `${diffLines}` : "±0";

      return {
        content: `Edited ${filePath}: replaced ${oldLines} lines with ${newLines} lines (${diffStr} lines)`,
      };
    } catch (e) {
      return { content: `Error editing file: ${e}`, isError: true };
    }
  },
});
