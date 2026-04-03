/**
 * repl.tsx - 交互式 REPL 入口
 *
 * 对应真实 Claude Code: src/main.tsx
 *
 * 使用方式：
 *   ANTHROPIC_API_KEY=sk-xxx bun run repl.tsx
 */

import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";

render(<App />);
