<div align="center">

# Open Claude Code

### 12 章从零构建一个 Claude Code 克隆版

> 唯一基于 512K+ 行真实源码的逆向工程教程 — 不只教你用，教你造

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?repo=anthhub/open-claude-code)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-orange?logo=bun)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/Docs-GitHub%20Pages-blue)](https://anthhub.github.io/open-claude-code/)

[English](README.md) · [在线文档](https://anthhub.github.io/open-claude-code/) · [Codespaces](https://github.com/codespaces/new?repo=anthhub/open-claude-code)

</div>

---

## 为什么选择这个项目？

大多数教程教你怎么**用** Claude Code。这个教程教你怎么**造** Claude Code。

我们拿到了真实的 Claude Code 源码快照（约 1,900 个文件，512K+ 行 TypeScript），逆向分析其架构，并将其拆解为 12 章渐进式教程。学完之后，你将拥有 `mini-claude` — 一个可运行的 AI 编程助手，具备以下能力：

- **Agentic Loop** — AI 自主调用工具并循环推理
- **7 个内置工具** — Read、Write、Edit、Bash、Grep、Glob、Echo
- **流式 API** — 基于 Anthropic SDK 的逐 Token 实时输出
- **权限系统** — 危险命令拦截与审批流程
- **交互式终端 UI** — React + Ink REPL，和真正的 Claude Code 一样
- **CLI（Commander.js）** — `--model`、`--prompt`、`--print`
- **斜杠命令** — `/help`、`/clear`、`/compact`
- **会话历史** — 跨运行的持久化对话
- **重试与错误处理** — 指数退避，生产级可靠性

每个功能都 1:1 对应真实 Claude Code 架构。没有空话，没有玩具示例。

---

## 有什么不同？

| | 其他教程 | Open Claude Code |
|---|---|---|
| **方式** | "教你怎么用 Claude Code" | "教你怎么**造** Claude Code" |
| **来源** | 通用 AI Agent 概念 | 512K+ 行真实源码分析 |
| **产出** | 知识 | 一个可运行的 AI 编程助手 |
| **学习** | 被动阅读文档 | 逐章动手构建 |
| **环境** | 静态 Markdown | Codespaces + Jupyter + VitePress |

---

## 快速开始

### 方式一：一键云端环境

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?repo=anthhub/open-claude-code)

零配置，浏览器内即刻开始。

### 方式二：本地安装

```bash
git clone https://github.com/anthhub/open-claude-code.git
cd open-claude-code/demo
bun install
bun run demo                              # 脚本模式验证
ANTHROPIC_API_KEY=sk-xxx bun run start    # 交互式 REPL
```

然后打开[第 1 章](docs/zh-CN/01-overview.md)，开始构建。

---

## 12 章学习路线

| # | 章节 | 难度 | 核心概念 | 状态 |
|---|------|------|----------|------|
| 1 | [项目概览与架构](docs/zh-CN/01-overview.md) | 入门 | 架构、模块划分、技术栈 | ✅ |
| 2 | [CLI 入口与启动流程](docs/zh-CN/02-cli-entrypoint.md) | 入门 | Commander.js、启动优化、并行预取 | ✅ |
| 3 | [工具系统](docs/zh-CN/03-tool-system.md) | 中级 | 工具接口、注册机制、执行流程 | ✅ |
| 4 | [命令系统](docs/zh-CN/04-command-system.md) | 中级 | 斜杠命令、注册机制、条件加载 | ✅ |
| 5 | [基于 Ink 的终端 UI](docs/zh-CN/05-ink-rendering.md) | 中级 | React/Ink、布局引擎、DOM 模型 | ✅ |
| 6 | [服务层与 API 通信](docs/zh-CN/06-service-layer.md) | 中级 | API 客户端、流式传输、Token 统计 | ✅ |
| 7 | [权限系统](docs/zh-CN/07-permission-system.md) | 中级 | 权限模式、审批流程、安全机制 | ✅ |
| 8 | [MCP 集成](docs/zh-CN/08-mcp-integration.md) | 高级 | MCP 协议、服务器管理、工具桥接 | ✅ |
| 9 | [智能体与多智能体协调](docs/zh-CN/09-agent-coordination.md) | 高级 | 子智能体、团队协作、协调器、集群 | ✅ |
| 10 | [插件与技能系统](docs/zh-CN/10-plugin-skill-system.md) | 高级 | 插件加载、技能定义、可扩展性 | ✅ |
| 11 | [状态管理与上下文](docs/zh-CN/11-state-context.md) | 高级 | 状态存储、上下文压缩、持久记忆 | ✅ |
| 12 | [高级特性](docs/zh-CN/12-advanced-features.md) | 专家 | 沙盒执行、语音输入、IDE 桥接、远程执行 | ✅ |

### 关键里程碑

| 完成章节 | 你能做什么 |
|---------|-----------|
| **第 2 章** | 工具可以执行 shell 命令和读取文件 |
| **第 4 章** | 完整的 Agentic Loop — AI 自动调用工具并循环推理 |
| **第 8 章** | 交互式终端 UI，体验接近真实 Claude Code |
| **第 12 章** | 功能完整的 AI 编程助手 |

---

## 章节详情

### 基础篇（第 1-2 章）

- **[01 - 项目概览与架构](docs/zh-CN/01-overview.md)**
  理解高层结构、模块边界和技术选型。了解约 1,900 个文件如何组织成一个连贯的系统。

- **[02 - CLI 入口与启动流程](docs/zh-CN/02-cli-entrypoint.md)**
  从 `claude` 命令到第一帧渲染的完整执行路径。理解 Commander.js 集成和并行预取优化。

### 核心系统（第 3-7 章）

- **[03 - 工具系统](docs/zh-CN/03-tool-system.md)**
  Claude Code 的每项能力都是一个"工具"。学习工具接口、注册方式，以及执行管道如何处理调用、错误和结果。

- **[04 - 命令系统](docs/zh-CN/04-command-system.md)**
  斜杠命令（`/help`、`/clear`、`/mcp`）是面向用户的控制平面。学习注册机制、条件加载，以及命令与工具的区别。

- **[05 - 基于 Ink 的终端 UI](docs/zh-CN/05-ink-rendering.md)**
  终端中的 React——出乎意料地强大。学习 Ink 的 DOM 模型、布局引擎和协调器如何实现响应式 TUI。

- **[06 - 服务层与 API 通信](docs/zh-CN/06-service-layer.md)**
  Claude Code 与 Anthropic API 之间的桥梁。流式响应、Token 统计、重试逻辑和成本计算。

- **[07 - 权限系统](docs/zh-CN/07-permission-system.md)**
  安全而不繁琐。学习权限模式（auto、ask、manual）、审批流程，以及危险操作的门控机制。

### 高级系统（第 8-12 章）

- **[08 - MCP 集成](docs/zh-CN/08-mcp-integration.md)**
  模型上下文协议将外部服务器变成工具提供者。学习 Claude Code 如何发现、连接和桥接 MCP 服务器。

- **[09 - 智能体与多智能体协调](docs/zh-CN/09-agent-coordination.md)**
  Claude Code 可以生成并协调子智能体。学习协调器模式、智能体团队、任务委派和集群架构。

- **[10 - 插件与技能系统](docs/zh-CN/10-plugin-skill-system.md)**
  无需 fork 即可扩展。插件如何加载、技能如何定义，以及系统如何解决冲突。

- **[11 - 状态管理与上下文](docs/zh-CN/11-state-context.md)**
  长对话需要智能的状态管理。学习存储设计、上下文压缩策略和持久记忆系统。

- **[12 - 高级特性](docs/zh-CN/12-advanced-features.md)**
  前沿功能：沙盒执行、语音输入、IDE 桥接协议和远程智能体执行。

---

## 每章构建内容

| 章 | 新增模块 | 完成后 Demo 能力 |
|----|---------|----------------|
| 1 | 项目脚手架 + 类型系统 | 类型定义可编译 |
| 2 | Tool.ts + tools.ts | 工具接口与注册表 |
| 3 | services/api/ + context.ts | 流式 API 调用 |
| 4 | query.ts + utils/messages.ts | 多轮工具调用循环 |
| 5 | tools/BashTool、FileReadTool、GrepTool | 执行命令、读取文件、搜索 |
| 6 | tools/FileWriteTool、FileEditTool、GlobTool | 完整文件操作 |
| 7 | utils/permissions.ts | 危险命令拦截 |
| 8 | screens/REPL.tsx + components/ | 交互式终端 UI |
| 9 | main.ts（Commander.js） | 完整 CLI 参数支持 |
| 10 | commands/ + compact 服务 | /help、/clear、/compact 命令 |
| 11 | components/PermissionRequest.tsx | 交互式权限确认对话框 |
| 12 | 历史记录、重试、错误处理 | 生产就绪的 demo |

---

## Demo：最终架构

```
demo/
├── main.ts                    # CLI 入口（Commander.js）
├── context.ts                 # 系统提示词构建器
├── query.ts                   # 查询循环（流式 + 工具调用）
├── Tool.ts                    # 工具接口与工厂
├── tools.ts                   # 工具注册表
├── types/
│   ├── message.ts             # 消息类型
│   └── permissions.ts         # 权限类型
├── tools/
│   ├── BashTool/
│   ├── FileReadTool/
│   ├── FileWriteTool/
│   ├── FileEditTool/
│   ├── GrepTool/
│   └── GlobTool/
├── services/
│   ├── api/claude.ts          # Anthropic SDK 封装
│   └── compact/compact.ts     # 上下文压缩
├── screens/REPL.tsx           # 终端 UI（Ink）
├── components/
│   ├── App.tsx
│   ├── MessageList.tsx
│   └── PermissionRequest.tsx
├── commands/
│   ├── clear.ts
│   ├── help.ts
│   └── compact.ts
└── utils/
    ├── permissions.ts
    ├── messages.ts
    ├── config.ts
    ├── history.ts
    ├── interactive-permission.ts
    └── retry.ts
```

### 架构对应关系

| Demo 文件 | 真实 Claude Code 对应文件 |
|-----------|--------------------------|
| `Tool.ts` | `src/Tool.ts` |
| `tools.ts` | `src/tools/index.ts` |
| `query.ts` | `src/query.ts` |
| `context.ts` | `src/context.ts` |
| `services/api/claude.ts` | `src/services/claude.ts` |
| `screens/REPL.tsx` | `src/screens/REPL.tsx` |
| `utils/permissions.ts` | `src/utils/permissions.ts` |

---

## 项目结构

```
open-claude-code/
├── README.md               # 英文版
├── README.zh-CN.md         # 本文件（中文版）
├── ROADMAP.md              # 可视化学习路线图
├── LICENSE
├── package.json
├── tsconfig.json
├── docs/
│   ├── en/                 # 英文章节文档
│   └── zh-CN/              # 中文章节文档
├── examples/               # 每章可运行示例
├── demo/                   # mini-claude：你逐章构建的渐进式 demo
└── diagrams/               # 架构图
```

---

## 前置要求

- **Node.js 18+** — `node --version`
- **Bun** — [bun.sh](https://bun.sh)（用于直接运行 TypeScript 示例）
- **TypeScript 基础** — 能读懂类型化代码；源码中大量使用泛型和装饰器
- **基本的终端/CLI 使用经验** — 你将阅读一个 CLI 应用的源码

无需预先了解 Claude 或 Anthropic 的 API — 我们从第一原理出发逐一讲解。

---

## 参与贡献

欢迎贡献！你可以：

- 修正文档中的错误或改进说明
- 添加或改进可运行示例
- 将章节翻译成更多语言
- 为复杂流程添加架构图

提交较大改动前请先开 Issue 讨论。

---

## 致谢

源码快照来自 [anthhub/claude-code](https://github.com/anthhub/claude-code) 仓库。本项目是独立的教育资源，与 Anthropic 官方无关。

---

## 许可证

MIT — 详见 [LICENSE](./LICENSE)
