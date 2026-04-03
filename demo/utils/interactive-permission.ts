/**
 * utils/interactive-permission.ts - 交互式权限确认
 *
 * 在终端中当工具需要 "ask" 权限时，暂停执行并等待用户确认。
 * 非 REPL 模式下（如 --prompt），自动允许。
 */

import type { PermissionDecision, CheckPermissionFn } from "../types/index.js";
import { checkPermission, createPermissionContext } from "./permissions.js";
import type { PermissionContext } from "../types/index.js";
import * as readline from "readline";

/**
 * 在终端中提示用户确认
 */
async function promptUser(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`⚠ ${message} [Y/n] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== "n");
    });
  });
}

/**
 * 创建交互式权限检查函数
 *
 * 对 "ask" 决策弹出终端确认提示。
 * 用户按 Enter 或输入 Y 允许，输入 n 拒绝。
 */
export function createInteractiveCheckPermission(
  context: PermissionContext,
  interactive: boolean = true
): CheckPermissionFn {
  return async (toolName, input) => {
    const decision = checkPermission(toolName, input, context);

    if (decision.behavior === "ask" && interactive) {
      const inputStr = JSON.stringify(input).substring(0, 80);
      const allowed = await promptUser(
        `${toolName}(${inputStr}) — ${(decision as { message: string }).message}`
      );
      if (allowed) return { behavior: "allow" };
      return { behavior: "deny", message: "User denied" };
    }

    return decision;
  };
}
