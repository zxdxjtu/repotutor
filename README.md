# RepoTutor

> AI 驱动的代码仓库智能讲解系统 - 结合语音合成、IDE 导航和交互式教程

## 概述

RepoTutor 是一个创新的代码学习工具,通过 Claude Code 和 MCP (Model Context Protocol) 技术,为任意代码仓库提供智能化、结构化的讲解服务。

### 核心特性

🎙️ **智能语音合成**
- 使用 Google Gemini TTS 生成自然流畅的中文/英文讲解
- 支持暂停、继续、停止等播放控制
- 自动缓存音频文件,避免重复生成

🧭 **IDE 智能导航**
- 自动在 VSCode/Cursor/Qoder 中打开相关代码文件
- 精准定位到具体代码行
- 支持高亮显示代码片段
- 跟随讲解进度同步显示代码

📚 **结构化教程生成**
- 自动分析代码仓库结构
- 生成多章节讲解大纲
- 智能识别关键代码检查点
- 支持自定义讲解重点和风格

🔄 **完整交互体验**
- 语音 + 代码 + 导航三位一体
- 支持跳转到指定章节
- 查看讲解进度和状态
- 可暂停/继续/停止讲解

## 快速开始

### 30 秒配置

```bash
# 1. 进入你的代码仓库
cd /path/to/your/project

# 2. 运行自动配置脚本
bash /path/to/repotutor/scripts/setup-repotutor.sh -y

# 3. 重启 Claude Code 并启用 MCP 服务器
/mcp

# 4. 开始讲解!
/tutor
```

详细说明请查看 [快速开始指南](./QUICK_START.md)

## 架构设计

RepoTutor 采用模块化架构,由 3 个独立的 MCP 服务器组成:

```
repotutor/
├── mcp-servers/
│   ├── tts-mcp/                    # 语音合成服务
│   │   ├── src/
│   │   │   └── index.ts            # Gemini TTS 集成
│   │   └── dist/
│   ├── ide-control-mcp/            # IDE 控制服务
│   │   ├── src/
│   │   │   └── index.ts            # VSCode/Cursor/Qoder 集成
│   │   └── dist/
│   └── audio-player-mcp/           # 音频播放服务
│       ├── src/
│       │   └── index.ts            # macOS afplay 集成
│       └── dist/
├── scripts/
│   ├── setup-repotutor.sh          # 自动配置脚本
│   └── README.md                   # 脚本文档
└── lib/                             # 共享库 (未来扩展)
```

### MCP 服务器说明

| 服务器 | 功能 | 依赖 | 通信方式 |
|--------|------|------|----------|
| `repotutor-tts` | Gemini TTS 语音合成 | GEMINI_API_KEY | stdio |
| `repotutor-ide-control` | IDE 文件导航和定位 | VSCode/Cursor/Qoder | stdio |
| `repotutor-audio-player` | 音频播放控制 | macOS `afplay` | stdio |

## 技术栈

- **运行时**: Node.js >= 18.0.0
- **语言**: TypeScript
- **协议**: MCP (Model Context Protocol)
- **TTS 引擎**: Google Gemini API
- **IDE 支持**: VSCode, Cursor, Qoder
- **音频播放**: macOS `afplay`

## 安装与配置

### 前置要求

1. **Node.js** >= 18.0.0
2. **Claude Code** CLI
3. **GEMINI_API_KEY** (用于 TTS)
4. **支持的 IDE** (VSCode/Cursor/Qoder)

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/zxdxjtu/repotutor.git
cd repotutor
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 构建 MCP 服务器

```bash
npm run build
```

#### 4. 配置环境变量

编辑 `~/.zshrc` 或 `~/.bashrc`:

```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

重新加载配置:

```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

#### 5. 为目标项目配置 RepoTutor

```bash
cd /path/to/your/target/project
bash /path/to/repotutor/scripts/setup-repotutor.sh -y
```

#### 6. 启用 MCP 服务器

重启 Claude Code 并运行:

```bash
/mcp
```

启用以下 3 个服务器:
- `repotutor-tts`
- `repotutor-ide-control`
- `repotutor-audio-player`

## 使用方法

### 基础用法

在 Claude Code 中运行:

```bash
/tutor
```

Claude 会自动:
1. 分析代码仓库结构
2. 生成讲解大纲和脚本
3. 合成语音并播放
4. 在 IDE 中打开相关代码

### 高级用法

#### 指定讲解内容

```
/tutor

请只讲解以下模块:
- 用户认证系统 (src/auth/)
- API 路由层 (src/routes/)
```

#### 自定义讲解风格

```
/tutor

请用简洁的技术风格讲解,重点关注:
1. 架构设计模式
2. 关键抽象层
3. 性能优化点
```

#### 控制讲解进度

- **查看状态**: `/tutor-status`
- **暂停讲解**: `/tutor-pause`
- **继续讲解**: `/tutor-continue`
- **跳转章节**: `/tutor-goto section-02`
- **停止讲解**: `/tutor-stop`

## 配置文件

### `.mcp.json` (项目级配置)

配置脚本会在目标项目根目录自动生成:

```json
{
  "mcpServers": {
    "repotutor-tts": {
      "command": "node",
      "args": ["/absolute/path/to/repotutor/mcp-servers/tts-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    },
    "repotutor-ide-control": {
      "command": "node",
      "args": ["/absolute/path/to/repotutor/mcp-servers/ide-control-mcp/dist/index.js"]
    },
    "repotutor-audio-player": {
      "command": "node",
      "args": ["/absolute/path/to/repotutor/mcp-servers/audio-player-mcp/dist/index.js"]
    }
  }
}
```

### `~/.claude.json` (全局配置)

Claude Code 会自动发现 `.mcp.json`,但需要手动启用服务器:

```json
{
  "/path/to/your/project": {
    "enabledMcpjsonServers": [
      "repotutor-tts",
      "repotutor-ide-control",
      "repotutor-audio-player"
    ]
  }
}
```

## 开发指南

### 项目结构

```
repotutor/
├── mcp-servers/               # MCP 服务器
│   ├── tts-mcp/
│   │   ├── src/
│   │   │   └── index.ts      # TTS 服务器实现
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ide-control-mcp/
│   │   ├── src/
│   │   │   └── index.ts      # IDE 控制实现
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── audio-player-mcp/
│       ├── src/
│       │   └── index.ts      # 音频播放实现
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── setup-repotutor.sh    # 自动配置脚本
│   └── README.md             # 脚本文档
├── lib/                       # 共享库
├── package.json               # 根 package.json (workspace)
├── tsconfig.base.json         # TypeScript 基础配置
├── QUICK_START.md             # 快速开始指南
└── README.md                  # 本文件
```

### 开发工作流

#### 1. 开发模式

```bash
# 监听所有 MCP 服务器的变化并自动重新编译
npm run dev
```

#### 2. 构建

```bash
# 构建所有 MCP 服务器
npm run build
```

#### 3. 清理

```bash
# 清理所有构建产物
npm run clean
```

#### 4. 测试单个 MCP 服务器

```bash
# 测试 TTS 服务器
cd mcp-servers/tts-mcp
npm run start

# 测试 IDE 控制服务器
cd mcp-servers/ide-control-mcp
npm run start

# 测试音频播放服务器
cd mcp-servers/audio-player-mcp
npm run start
```

### 添加新功能

#### 示例: 添加新的 MCP 工具到 TTS 服务器

编辑 `mcp-servers/tts-mcp/src/index.ts`:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "synthesize_speech",
        description: "将文本转换为语音",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            voice: { type: "string" },
          },
          required: ["text"],
        },
      },
      // 添加新工具
      {
        name: "list_voices",
        description: "列出所有可用的语音",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});
```

## 故障排查

### 问题: MCP 服务器未启动

**检查步骤**:

1. 验证构建产物存在:
   ```bash
   ls mcp-servers/*/dist/index.js
   ```

2. 手动测试服务器:
   ```bash
   node mcp-servers/tts-mcp/dist/index.js
   ```

3. 检查 Claude Code 日志:
   ```bash
   ~/.claude/logs/
   ```

### 问题: TTS 不工作

**检查步骤**:

1. 验证 API Key:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. 测试 Gemini API:
   ```bash
   curl -H "Content-Type: application/json" \
        -d '{"text":"Hello"}' \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        https://texttospeech.googleapis.com/v1/text:synthesize
   ```

### 问题: IDE 导航不工作

**检查步骤**:

1. 验证 IDE 命令可用:
   ```bash
   which code   # VSCode
   which cursor # Cursor
   which qoder  # Qoder
   ```

2. 确保 IDE 正在运行

3. 检查工作区路径设置是否正确

更多问题请查看 [快速开始指南 - 常见问题](./QUICK_START.md#常见问题)

## 贡献指南

欢迎贡献! 请遵循以下步骤:

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写清晰的注释
- 添加单元测试

## 路线图

- [ ] 支持更多 TTS 引擎 (Azure, AWS Polly)
- [ ] 支持更多 IDE (IntelliJ IDEA, Vim)
- [ ] Web UI 界面
- [ ] 支持多语言讲解
- [ ] 自定义讲解模板
- [ ] 讲解内容导出 (Markdown, PDF)
- [ ] 团队协作功能

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 致谢

- [Claude Code](https://github.com/anthropics/claude-code) - AI CLI 工具
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议
- [Google Gemini](https://ai.google.dev/) - TTS 引擎

## 联系方式

- Issues: https://github.com/zxdxjtu/repotutor/issues

---

**用 AI 重新定义代码学习体验** 🚀
