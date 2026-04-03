/**
 * cli.ts - Commander.js CLI 入口
 *
 * 对应真实 Claude Code: src/entrypoints/cli.tsx
 * 解析命令行参数，决定运行模式，启动对应流程。
 */

import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "./components/App.js";
import { query } from "./query.js";
import { allTools } from "./tools.js";
import { createPermissionContext, createCheckPermissionFn } from "./utils/permissions.js";
import { DEFAULT_MODEL, DEFAULT_CONFIG } from "./types/index.js";
import type { PermissionMode } from "./types/index.js";

const program = new Command();

program
  .name("mini-claude")
  .description("A minimal Claude Code clone — built chapter by chapter")
  .version("0.1.0")
  .option("-m, --model <model>", "Model to use", DEFAULT_MODEL)
  .option("--max-tokens <n>", "Max output tokens", "4096")
  .option("--permission-mode <mode>", "Permission mode: default, auto, bypassPermissions", "auto")
  .option("-p, --prompt <text>", "Run a single prompt (non-interactive mode)")
  .option("--print", "Print response and exit (implies -p)")
  .action(async (options) => {
    const model = options.model;
    const maxTokens = parseInt(options.maxTokens, 10);
    const permMode = options.permissionMode as PermissionMode;

    // 非交互模式：单次查询
    if (options.prompt || options.print) {
      const promptText = options.prompt ?? process.argv.slice(2).join(" ");
      if (!promptText) {
        console.error("Error: --prompt requires a text argument");
        process.exit(1);
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        console.error("Error: ANTHROPIC_API_KEY not set");
        process.exit(1);
      }

      const permCtx = createPermissionContext(permMode);
      const checkPerm = createCheckPermissionFn(permCtx);

      const result = await query(promptText, [], {
        model,
        maxTokens,
        checkPermission: checkPerm,
        onText: (text) => process.stdout.write(text),
        onToolUse: (name) => {
          if (!options.print) {
            process.stderr.write(`\n[tool: ${name}]\n`);
          }
        },
      });

      if (!options.print) {
        console.error(`\n[${result.turns} turns, ${result.inputTokens}+${result.outputTokens} tokens]`);
      }
      process.exit(0);
    }

    // 交互模式：启动 REPL
    render(React.createElement(App, { model, maxTokens, permissionMode: permMode }));
  });

program.parse();
