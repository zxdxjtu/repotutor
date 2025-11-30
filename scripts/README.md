# RepoTutor 自动配置脚本

## 概述

`setup-repotutor.sh` 是一个自动化脚本,可以为任意代码仓库快速配置 RepoTutor 讲解系统。

## 功能特性

✅ 自动检查环境依赖 (Node.js, npm, GEMINI_API_KEY)
✅ 自动构建 RepoTutor MCP 服务器
✅ 生成目标仓库的 `.mcp.json` 配置文件
✅ 提供 Claude Code 配置指南
✅ 自动更新 `.gitignore` 防止配置文件被提交

## 前置要求

### 必需
- **Node.js** >= 18.0.0
- **npm** (通常随 Node.js 安装)
- **Claude Code** CLI 工具

### 可选
- **GEMINI_API_KEY** - 用于 TTS (文本转语音) 功能
  - 如果没有此 API Key,其他功能仍可正常使用,只是无法生成语音讲解

## 快速开始

### 1. 配置 GEMINI_API_KEY (可选但推荐)

编辑你的 shell 配置文件 (`~/.zshrc` 或 `~/.bashrc`):

```bash
export GEMINI_API_KEY='your-gemini-api-key-here'
```

然后重新加载配置:

```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

### 2. 进入目标代码仓库

```bash
cd /path/to/your/project
```

### 3. 运行配置脚本

```bash
bash /path/to/repotutor/scripts/setup-repotutor.sh
```

**示例**:

```bash
# 如果 RepoTutor 在 ~/Desktop/repo/repotutor
# 目标项目在 ~/my-awesome-project

cd ~/my-awesome-project
bash ~/Desktop/repo/repotutor/scripts/setup-repotutor.sh
```

### 4. 按照提示操作

脚本会执行以下步骤:

1. **环境检查** - 验证 Node.js, npm, GEMINI_API_KEY
2. **构建 MCP 服务器** - 编译 TypeScript 到 JavaScript
3. **生成 .mcp.json** - 在目标仓库创建 MCP 配置文件
4. **配置指南** - 提示如何启用 Claude Code MCP 服务器
5. **更新 .gitignore** - 添加 RepoTutor 相关条目

### 5. 启用 MCP 服务器

重启 Claude Code 后,在 Claude Code 中运行:

```bash
/mcp
```

找到以下 3 个 MCP 服务器并启用它们:
- `repotutor-tts` - 语音合成
- `repotutor-ide-control` - IDE 导航
- `repotutor-audio-player` - 音频播放

### 6. 开始使用 RepoTutor

在 Claude Code 中运行:

```bash
/tutor
```

## 配置文件说明

### `.mcp.json`

配置脚本会在目标仓库根目录生成 `.mcp.json`:

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

### MCP 服务器说明

| 服务器 | 功能 | 依赖 |
|--------|------|------|
| `repotutor-tts` | Gemini TTS 语音合成 | GEMINI_API_KEY |
| `repotutor-ide-control` | IDE 文件导航和定位 | VSCode/Cursor/Qoder |
| `repotutor-audio-player` | 音频播放控制 | macOS `afplay` |

## 手动启用 MCP 服务器

如果你想手动配置而不是使用 `/mcp` 命令,可以编辑 `~/.claude.json`:

找到对应项目的配置块,添加:

```json
{
  "/path/to/your/project": {
    "allowedTools": [],
    "mcpContextUris": [],
    "mcpServers": {},
    "enabledMcpjsonServers": [
      "repotutor-tts",
      "repotutor-ide-control",
      "repotutor-audio-player"
    ],
    "disabledMcpjsonServers": [],
    "hasTrustDialogAccepted": false
  }
}
```

## 故障排查

### 问题: "Node.js 未安装"

**解决方案**: 安装 Node.js >= 18.0.0

```bash
# 使用 Homebrew (macOS)
brew install node

# 或访问 https://nodejs.org/
```

### 问题: "GEMINI_API_KEY 环境变量未设置"

**解决方案**:

1. 获取 Gemini API Key: https://aistudio.google.com/
2. 添加到 shell 配置:
   ```bash
   echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc
   source ~/.zshrc
   ```

### 问题: MCP 服务器未出现在 `/mcp` 列表中

**可能原因**:
1. 未重启 Claude Code
2. `.mcp.json` 文件格式错误
3. MCP 服务器路径不正确

**解决方案**:
1. 完全退出并重启 Claude Code
2. 检查 `.mcp.json` 是否是有效的 JSON
3. 验证 MCP 服务器路径是否存在:
   ```bash
   ls /path/to/repotutor/mcp-servers/*/dist/index.js
   ```

### 问题: TTS 不工作但其他功能正常

**可能原因**: GEMINI_API_KEY 未设置或无效

**解决方案**:
1. 验证环境变量: `echo $GEMINI_API_KEY`
2. 测试 API Key 有效性
3. 重启 Claude Code 使环境变量生效

### 问题: IDE 导航不工作

**可能原因**:
1. 不支持的 IDE (目前支持 VSCode/Cursor/Qoder)
2. IDE 未在运行

**解决方案**:
1. 确认使用的是支持的 IDE
2. 确保 IDE 正在运行
3. 检查 IDE 命令行工具是否可用 (`code`, `cursor`, `qoder`)

## 卸载

如果要移除 RepoTutor 配置:

```bash
cd /path/to/your/project

# 删除配置文件
rm .mcp.json

# 删除 RepoTutor 生成的数据
rm -rf .repotutor

# 手动从 ~/.claude.json 中移除 enabledMcpjsonServers 配置
```

## 高级用法

### 为多个项目配置

```bash
#!/bin/bash

PROJECTS=(
  "/path/to/project1"
  "/path/to/project2"
  "/path/to/project3"
)

for project in "${PROJECTS[@]}"; do
  cd "$project"
  bash /path/to/repotutor/scripts/setup-repotutor.sh
done
```

### 自定义 MCP 服务器路径

如果你的 RepoTutor 不在标准位置,脚本会自动检测其实际位置并生成正确的绝对路径。

### CI/CD 集成

可以将此脚本集成到 CI/CD 流程中,自动为新克隆的仓库配置 RepoTutor:

```yaml
# .github/workflows/setup-repotutor.yml
name: Setup RepoTutor
on:
  workflow_dispatch:

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup RepoTutor
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          bash /path/to/repotutor/scripts/setup-repotutor.sh
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进此脚本!

## 许可证

MIT
