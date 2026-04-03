/**
 * utils/history.ts - 会话历史持久化
 *
 * 对应真实 Claude Code 的会话历史存储。
 * 将对话历史保存到文件，支持下次恢复。
 */

import type { Message } from "../types/index.js";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const HISTORY_DIR = join(process.env.HOME ?? ".", ".mini-claude", "sessions");

/**
 * 保存会话历史
 */
export async function saveSession(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
  const filePath = join(HISTORY_DIR, `${sessionId}.json`);
  await Bun.write(filePath, JSON.stringify(messages, null, 2));
}

/**
 * 加载会话历史
 */
export async function loadSession(sessionId: string): Promise<Message[] | null> {
  const filePath = join(HISTORY_DIR, `${sessionId}.json`);
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) return null;
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

/**
 * 列出所有会话
 */
export function listSessions(): string[] {
  if (!existsSync(HISTORY_DIR)) return [];
  return readdirSync(HISTORY_DIR)
    .filter((f: string) => f.endsWith(".json"))
    .map((f: string) => f.replace(".json", ""));
}

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
}
