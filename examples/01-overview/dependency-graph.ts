/**
 * dependency-graph.ts
 *
 * 功能：分析 Claude Code 源码的模块间依赖关系，输出依赖图和统计信息
 * Function: Analyze inter-module dependencies in Claude Code source and visualize them
 *
 * 使用方法 / Usage:
 *   bun run examples/01-overview/dependency-graph.ts
 *   bun run examples/01-overview/dependency-graph.ts /path/to/src
 *
 * 默认分析路径 / Default path: ../../anthhub-claude-code/src
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, resolve, extname, relative, dirname } from "path";

// ─── 类型定义 / Type definitions ───────────────────────────────────────────

// 模块依赖图：每个顶级模块 → 它所依赖的其他顶级模块集合
type DependencyMap = Map<string, Set<string>>;

// ─── 文件扫描 / File scanning ──────────────────────────────────────────────

/**
 * 递归收集目录下所有 .ts / .tsx 文件
 * Recursively collect all .ts/.tsx files under a directory
 */
async function collectTsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (["node_modules", ".git", "dist", "build"].includes(entry)) continue;

    const fullPath = join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      results.push(...await collectTsFiles(fullPath));
    } else {
      const ext = extname(entry);
      if (ext === ".ts" || ext === ".tsx") {
        results.push(fullPath);
      }
    }
  }

  return results;
}

// ─── Import 提取 / Import extraction ──────────────────────────────────────

/**
 * 从文件内容中提取所有 import 路径
 * Extract all import specifiers from TypeScript source
 *
 * 支持以下格式 / Supports:
 *   import foo from './foo'
 *   import { bar } from "../bar"
 *   import type { Baz } from './baz'
 *   const x = await import('./dynamic')
 *   export { ... } from './re-export'
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // 静态 import / export ... from '...'
  const staticRe = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(content)) !== null) {
    imports.push(m[1]);
  }

  // 动态 import('...')
  const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicRe.exec(content)) !== null) {
    imports.push(m[1]);
  }

  return imports;
}

/**
 * 将 import 路径解析为顶级模块名
 * Resolve an import specifier to a top-level module name under srcRoot
 *
 * 例如 / Example:
 *   从 src/commands/foo.ts 导入 '../tools/bar'
 *   → 绝对路径 src/tools/bar.ts → 顶级模块 'tools'
 *
 * 返回 null 表示外部依赖（node_modules）或无法解析
 */
function resolveToTopLevel(
  importPath: string,
  fromFile: string,
  srcRoot: string
): string | null {
  // 忽略外部依赖（不以 . 开头）
  if (!importPath.startsWith(".")) return null;

  // 将相对路径解析为绝对路径
  const absPath = resolve(dirname(fromFile), importPath);

  // 必须在 srcRoot 下
  if (!absPath.startsWith(srcRoot)) return null;

  // 取 srcRoot 之后的第一段路径
  const rel = relative(srcRoot, absPath); // 例如 "tools/bar" 或 "utils.ts"
  const topLevel = rel.split("/")[0].replace(/\.(ts|tsx)$/, ""); // 去掉扩展名

  return topLevel || null;
}

// ─── 依赖图构建 / Build dependency graph ──────────────────────────────────

async function buildDependencyGraph(srcRoot: string): Promise<DependencyMap> {
  const graph: DependencyMap = new Map();

  // 获取顶级模块列表（用于过滤有效的依赖目标）
  const topEntries = new Set(await readdir(srcRoot));

  // 收集所有 TS 文件
  const allFiles = await collectTsFiles(srcRoot);

  for (const filePath of allFiles) {
    // 找到这个文件所属的顶级模块
    const rel = relative(srcRoot, filePath); // 例如 "commands/run.ts"
    const fromModule = rel.split("/")[0].replace(/\.(ts|tsx)$/, "");

    if (!graph.has(fromModule)) {
      graph.set(fromModule, new Set());
    }

    // 读取文件并提取 import
    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }

    const imports = extractImports(content);

    for (const imp of imports) {
      const toModule = resolveToTopLevel(imp, filePath, srcRoot);

      // 忽略自身依赖、外部依赖、以及不在顶级列表中的路径
      if (
        toModule &&
        toModule !== fromModule &&
        topEntries.has(toModule)
      ) {
        graph.get(fromModule)!.add(toModule);
      }
    }
  }

  return graph;
}

// ─── 统计计算 / Statistics ─────────────────────────────────────────────────

interface DegreeStats {
  name: string;
  inDegree: number;   // 有多少模块依赖它（被引用次数）
  outDegree: number;  // 它依赖多少其他模块
}

function computeDegrees(graph: DependencyMap): DegreeStats[] {
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};

  // 初始化所有模块
  for (const [mod] of graph) {
    inDegree[mod] = inDegree[mod] ?? 0;
    outDegree[mod] = 0;
  }

  for (const [mod, deps] of graph) {
    outDegree[mod] = deps.size;
    for (const dep of deps) {
      inDegree[dep] = (inDegree[dep] ?? 0) + 1;
    }
  }

  // 合并所有出现过的模块（包括只作为被依赖方出现的）
  const allModules = new Set([...Object.keys(inDegree), ...Object.keys(outDegree)]);

  return Array.from(allModules).map((name) => ({
    name,
    inDegree: inDegree[name] ?? 0,
    outDegree: outDegree[name] ?? 0,
  }));
}

// ─── ASCII 依赖图 / ASCII graph ────────────────────────────────────────────

/**
 * 渲染简单的 ASCII 依赖邻接表
 * Render dependency adjacency list in ASCII
 */
function renderAdjacencyList(graph: DependencyMap) {
  // 按模块名排序
  const sorted = Array.from(graph.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const maxNameLen = Math.max(...sorted.map(([name]) => name.length), 8);

  for (const [mod, deps] of sorted) {
    if (deps.size === 0) continue; // 跳过无依赖的模块

    const depList = Array.from(deps).sort().join(", ");
    console.log(`  ${mod.padEnd(maxNameLen)}  →  ${depList}`);
  }
}

// ─── 主程序 / Main ───────────────────────────────────────────────────────────

async function main() {
  // 默认相对于本脚本所在目录 / Default relative to this script file
  const rawPath = process.argv[2] ?? "../../../anthhub-claude-code/src";
  const srcRoot = resolve(import.meta.dirname, rawPath);

  // 路径检查
  try {
    await stat(srcRoot);
  } catch {
    console.error(`\n错误：路径不存在 —— ${srcRoot}`);
    console.error("请检查路径或传入正确的 src 目录路径。");
    console.error("用法: bun run examples/01-overview/dependency-graph.ts [path-to-src]");
    process.exit(1);
  }

  console.log("\nClaude Code Module Dependency Graph");
  console.log("=".repeat(42));
  console.log(`分析目录 / Analyzing: ${srcRoot}\n`);

  console.log("正在扫描 import 语句... / Scanning imports...");
  const graph = await buildDependencyGraph(srcRoot);

  // ── 1. 依赖邻接表 / Adjacency list ──────────────────────────────────────
  console.log("\nDependency Matrix (→ depends on):\n");
  renderAdjacencyList(graph);

  // ── 2. 入度 / 出度统计 ────────────────────────────────────────────────
  const degrees = computeDegrees(graph);

  // 最多被依赖（入度高）
  const byInDegree = [...degrees]
    .filter((d) => d.inDegree > 0)
    .sort((a, b) => b.inDegree - a.inDegree)
    .slice(0, 10);

  // 依赖最多其他模块（出度高）
  const byOutDegree = [...degrees]
    .filter((d) => d.outDegree > 0)
    .sort((a, b) => b.outDegree - a.outDegree)
    .slice(0, 10);

  console.log("\nMost Depended-on Modules (In-degree — others import me):\n");
  byInDegree.forEach((d, i) => {
    const bar = "█".repeat(Math.min(d.inDegree, 30));
    console.log(`  ${String(i + 1).padStart(2)}. ${d.name.padEnd(20)} <- ${String(d.inDegree).padStart(3)} modules  ${bar}`);
  });

  console.log("\nMost Dependent Modules (Out-degree — I import others):\n");
  byOutDegree.forEach((d, i) => {
    const bar = "█".repeat(Math.min(d.outDegree, 30));
    console.log(`  ${String(i + 1).padStart(2)}. ${d.name.padEnd(20)} -> ${String(d.outDegree).padStart(3)} modules  ${bar}`);
  });

  // ── 3. 汇总 / Summary ──────────────────────────────────────────────────
  const totalEdges = Array.from(graph.values()).reduce(
    (s, deps) => s + deps.size,
    0
  );
  const isolated = Array.from(graph.values()).filter((d) => d.size === 0).length;

  console.log("\nSummary:");
  console.log(`  顶级模块数  / Top-level modules  : ${graph.size}`);
  console.log(`  依赖边总数  / Total dep edges     : ${totalEdges}`);
  console.log(`  无依赖模块  / Isolated modules    : ${isolated}`);
  if (byInDegree[0]) {
    console.log(`  最被依赖    / Most imported       : ${byInDegree[0].name} (${byInDegree[0].inDegree} modules)`);
  }
  if (byOutDegree[0]) {
    console.log(`  依赖最多    / Most dependent      : ${byOutDegree[0].name} (${byOutDegree[0].outDegree} modules)`);
  }
  console.log();
}

main();
