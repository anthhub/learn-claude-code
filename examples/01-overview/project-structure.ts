/**
 * project-structure.ts
 *
 * 功能：分析 Claude Code 源码的项目结构，输出结构化统计报告
 * Function: Analyze Claude Code source structure and output a formatted report
 *
 * 使用方法 / Usage:
 *   bun run examples/01-overview/project-structure.ts
 *   bun run examples/01-overview/project-structure.ts /path/to/src
 *
 * 默认分析路径 / Default path: ../../anthhub-claude-code/src
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, resolve, extname, relative } from "path";

// ─── 类型定义 / Type definitions ───────────────────────────────────────────

interface ModuleStats {
  name: string;       // 模块名（目录名或文件名）
  files: number;      // 文件总数
  tsLines: number;    // TypeScript 有效代码行数（排除空行和注释）
  fileTypes: Record<string, number>; // 文件类型分布 { ".ts": 10, ".tsx": 3 }
}

// ─── 核心逻辑 / Core logic ──────────────────────────────────────────────────

/**
 * 统计一段 TypeScript 代码的有效行数
 * Count non-empty, non-comment lines in TypeScript source
 */
function countTsLines(content: string): number {
  const lines = content.split("\n");
  let count = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 处理块注释 /* ... */
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      inBlockComment = !trimmed.includes("*/");
      continue;
    }

    // 跳过空行和单行注释
    if (trimmed === "" || trimmed.startsWith("//")) continue;

    count++;
  }

  return count;
}

/**
 * 递归扫描目录，返回所有文件路径
 * Recursively collect all file paths under a directory
 */
async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    // 跳过常见的非源码目录
    if (["node_modules", ".git", "dist", "build", "__pycache__"].includes(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      const sub = await collectFiles(fullPath);
      results.push(...sub);
    } else {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 分析单个顶级模块（目录或文件）的统计信息
 * Analyze stats for a single top-level module entry
 */
async function analyzeModule(
  srcRoot: string,
  entryName: string
): Promise<ModuleStats> {
  const entryPath = join(srcRoot, entryName);
  const info = await stat(entryPath);

  const stats: ModuleStats = {
    name: entryName,
    files: 0,
    tsLines: 0,
    fileTypes: {},
  };

  // 获取该模块下所有文件（目录则递归，文件直接取）
  const files = info.isDirectory()
    ? await collectFiles(entryPath)
    : [entryPath];

  for (const filePath of files) {
    stats.files++;
    const ext = extname(filePath) || "(none)";
    stats.fileTypes[ext] = (stats.fileTypes[ext] ?? 0) + 1;

    // 只对 .ts / .tsx 文件计算代码行数
    if (ext === ".ts" || ext === ".tsx") {
      try {
        const content = await readFile(filePath, "utf-8");
        stats.tsLines += countTsLines(content);
      } catch {
        // 读取失败时跳过
      }
    }
  }

  return stats;
}

// ─── 格式化输出 / Formatted output ──────────────────────────────────────────

/**
 * 右对齐数字并加千位分隔符
 * Right-align a number with thousands separator
 */
function fmtNum(n: number, width: number): string {
  const s = n.toLocaleString("en-US");
  return s.padStart(width);
}

function fmtPct(n: number, total: number, width: number): string {
  const pct = total === 0 ? "0.0%" : `${((n / total) * 100).toFixed(1)}%`;
  return pct.padStart(width);
}

function printTable(modules: ModuleStats[], totalFiles: number, totalLines: number) {
  // 表头
  const COL = { name: 20, files: 7, lines: 10, pct: 8 };
  const divider =
    "├" +
    "─".repeat(COL.name + 2) +
    "┼" +
    "─".repeat(COL.files + 2) +
    "┼" +
    "─".repeat(COL.lines + 2) +
    "┼" +
    "─".repeat(COL.pct + 2) +
    "┤";
  const top =
    "┌" +
    "─".repeat(COL.name + 2) +
    "┬" +
    "─".repeat(COL.files + 2) +
    "┬" +
    "─".repeat(COL.lines + 2) +
    "┬" +
    "─".repeat(COL.pct + 2) +
    "┐";
  const bottom =
    "└" +
    "─".repeat(COL.name + 2) +
    "┴" +
    "─".repeat(COL.files + 2) +
    "┴" +
    "─".repeat(COL.lines + 2) +
    "┴" +
    "─".repeat(COL.pct + 2) +
    "┘";
  const footer =
    "╞" +
    "═".repeat(COL.name + 2) +
    "╪" +
    "═".repeat(COL.files + 2) +
    "╪" +
    "═".repeat(COL.lines + 2) +
    "╪" +
    "═".repeat(COL.pct + 2) +
    "╡";

  const row = (name: string, files: number, lines: number, pct: string) =>
    `│ ${name.padEnd(COL.name)} │ ${fmtNum(files, COL.files)} │ ${fmtNum(lines, COL.lines)} │ ${pct.padStart(COL.pct)} │`;

  console.log(top);
  console.log(
    `│ ${"Module".padEnd(COL.name)} │ ${"Files".padStart(COL.files)} │ ${"TS Lines".padStart(COL.lines)} │ ${"% Total".padStart(COL.pct)} │`
  );
  console.log(divider);

  for (const m of modules) {
    const pct = fmtPct(m.tsLines, totalLines, COL.pct);
    console.log(row(m.name, m.files, m.tsLines, pct));
  }

  console.log(footer);
  console.log(row("TOTAL", totalFiles, totalLines, "100.0%"));
  console.log(bottom);
}

// ─── 主程序 / Main ───────────────────────────────────────────────────────────

async function main() {
  // 从命令行参数读取源码路径，默认相对于本脚本所在目录
  // Default path is relative to this script file, not the working directory
  const rawPath = process.argv[2] ?? "../../../anthhub-claude-code/src";
  const srcRoot = resolve(import.meta.dirname, rawPath);

  // 检查路径是否存在
  try {
    await stat(srcRoot);
  } catch {
    console.error(`\n错误：路径不存在 —— ${srcRoot}`);
    console.error("请检查路径或传入正确的 src 目录路径。");
    console.error("用法: bun run examples/01-overview/project-structure.ts [path-to-src]");
    process.exit(1);
  }

  console.log("\nClaude Code Source Structure Analysis");
  console.log("=".repeat(42));
  console.log(`分析目录 / Analyzing: ${srcRoot}\n`);

  // 获取顶级条目（目录 + 文件），按名称排序
  const topEntries = (await readdir(srcRoot)).sort();

  // 并行分析每个模块
  console.log("正在扫描文件... / Scanning files...");
  const moduleStats = await Promise.all(
    topEntries.map((entry) => analyzeModule(srcRoot, entry))
  );

  // 按 TS 代码行数降序排列
  moduleStats.sort((a, b) => b.tsLines - a.tsLines);

  // 计算总计
  const totalFiles = moduleStats.reduce((s, m) => s + m.files, 0);
  const totalLines = moduleStats.reduce((s, m) => s + m.tsLines, 0);

  console.log("\nModule Statistics (sorted by TS lines):\n");
  printTable(moduleStats, totalFiles, totalLines);

  // 文件类型汇总
  const allTypes: Record<string, number> = {};
  for (const m of moduleStats) {
    for (const [ext, cnt] of Object.entries(m.fileTypes)) {
      allTypes[ext] = (allTypes[ext] ?? 0) + cnt;
    }
  }

  console.log("\nFile Type Distribution:");
  const sortedTypes = Object.entries(allTypes).sort((a, b) => b[1] - a[1]);
  for (const [ext, cnt] of sortedTypes) {
    const bar = "█".repeat(Math.round((cnt / totalFiles) * 30));
    console.log(`  ${ext.padEnd(10)} ${String(cnt).padStart(5)}  ${bar}`);
  }

  console.log(`\nSummary:`);
  console.log(`  顶级模块数 / Top-level entries : ${topEntries.length}`);
  console.log(`  文件总数   / Total files       : ${totalFiles.toLocaleString()}`);
  console.log(`  TS 代码行数 / TS source lines  : ${totalLines.toLocaleString()}`);
  console.log();
}

main();
