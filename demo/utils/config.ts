/**
 * utils/config.ts - 配置加载
 *
 * 从多个来源加载配置（优先级从高到低）：
 * 1. CLI 参数
 * 2. 环境变量
 * 3. ~/.mini-claude/config.json
 * 4. 默认值
 */

import type { AppConfig } from "../types/index.js";
import { DEFAULT_CONFIG } from "../types/index.js";
import { existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.env.HOME ?? ".", ".mini-claude", "config.json");

/**
 * 加载配置文件
 */
export async function loadConfigFile(): Promise<Partial<AppConfig>> {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    const file = Bun.file(CONFIG_PATH);
    return JSON.parse(await file.text());
  } catch {
    return {};
  }
}

/**
 * 合并配置
 */
export function mergeConfig(
  cliOptions: Partial<AppConfig>,
  fileConfig: Partial<AppConfig>
): AppConfig {
  return {
    apiKey: cliOptions.apiKey
      ?? process.env.ANTHROPIC_API_KEY
      ?? fileConfig.apiKey
      ?? "",
    model: cliOptions.model ?? fileConfig.model ?? DEFAULT_CONFIG.model,
    maxTokens: cliOptions.maxTokens ?? fileConfig.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    permissionMode: cliOptions.permissionMode ?? fileConfig.permissionMode ?? DEFAULT_CONFIG.permissionMode,
    cwd: cliOptions.cwd ?? DEFAULT_CONFIG.cwd,
    systemPrompt: cliOptions.systemPrompt ?? fileConfig.systemPrompt,
  };
}
