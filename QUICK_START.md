# RepoTutor 快速开始指南

## 什么是 RepoTutor?

RepoTutor 是一个 AI 驱动的代码仓库讲解系统,可以为你的代码仓库提供:

- 🎙️ **语音讲解** - 使用 Gemini TTS 生成自然流畅的语音
- 🧭 **智能导航** - 在 IDE 中自动打开相关代码文件
- 📚 **结构化教程** - 按章节组织的完整代码讲解
- 🔄 **交互式体验** - 结合语音、代码和导航的沉浸式学习

## 一键配置

### 前置要求

1. **安装 Node.js** (>= 18.0.0)
   ```bash
   # macOS 使用 Homebrew
   brew install node

   # 或下载安装: https://nodejs.org/
   ```

2. **安装 Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. **获取 Gemini API Key** (可选,用于 TTS 功能)
   - 访问: https://aistudio.google.com/
   - 创建 API Key
   - 添加到环境变量:
     ```bash
     echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
     source ~/.zshrc
     ```

### 30 秒完成配置

```bash
# 1. 进入你的代码仓库
cd /path/to/your/awesome/project

# 2. 运行自动配置脚本 (非交互模式)
bash /path/to/repotutor/scripts/setup-repotutor.sh -y

# 3. 重启 Claude Code

# 4. 在 Claude Code 中启用 MCP 服务器
/mcp
# 启用: repotutor-tts, repotutor-ide-control, repotutor-audio-player

# 5. 开始讲解!
/tutor
```

## 示例: 为 Kode 项目配置 RepoTutor

假设你有以下目录结构:

```
~/Desktop/repo/
├── repotutor/          # RepoTutor 系统
└── Kode/               # 你的目标项目
```

### 步骤 1: 进入目标项目

```bash
cd ~/Desktop/repo/Kode
```

### 步骤 2: 运行配置脚本

```bash
bash ~/Desktop/repo/repotutor/scripts/setup-repotutor.sh -y
```

输出示例:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RepoTutor 自动配置工具
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RepoTutor 路径: /Users/a1/Desktop/repo/repotutor
目标仓库路径: /Users/a1/Desktop/repo/Kode
目标仓库名称: Kode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  步骤 1/5: 环境检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Node.js 已安装: v22.17.0
✓ npm 已安装: 10.9.2
✓ GEMINI_API_KEY 已设置

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  步骤 2/5: 构建 RepoTutor MCP 服务器
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ RepoTutor 依赖已存在
✓ MCP 服务器已构建

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  步骤 3/5: 生成 .mcp.json 配置文件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ .mcp.json 已生成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配置完成! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 步骤 3: 重启 Claude Code 并启用 MCP 服务器

```bash
# 退出 Claude Code
/exit

# 重新启动 Claude Code
claude-code

# 在 Claude Code 中运行
/mcp
```

你会看到 3 个 MCP 服务器:
- ✅ `repotutor-tts` - 点击启用
- ✅ `repotutor-ide-control` - 点击启用
- ✅ `repotutor-audio-player` - 点击启用

### 步骤 4: 开始讲解

```bash
/tutor
```

Claude 会:
1. 分析你的代码仓库结构
2. 生成结构化讲解大纲
3. 为每个章节生成讲解文本
4. 合成语音并播放
5. 在 IDE 中自动打开相关代码文件

## 配置文件说明

配置脚本会在你的项目中创建/修改以下文件:

### `.mcp.json` (项目根目录)

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

### `.gitignore` (自动更新)

脚本会自动添加以下条目防止配置文件被提交:

```gitignore
.repotutor/
.mcp.json
```

### `.repotutor/` 目录 (运行时生成)

```
.repotutor/
├── lecture/
│   ├── outline.json          # 讲解大纲
│   ├── checkpoints.json      # 代码检查点
│   └── scripts/              # 讲解文本
│       ├── section-01.md
│       ├── section-02.md
│       └── ...
└── audio/                     # 生成的音频文件
    ├── section-01.mp3
    ├── section-02.mp3
    └── ...
```

## 高级用法

### 为多个项目批量配置

创建批量配置脚本:

```bash
#!/bin/bash

REPOTUTOR_PATH="/Users/a1/Desktop/repo/repotutor"

PROJECTS=(
  "/Users/a1/projects/project-a"
  "/Users/a1/projects/project-b"
  "/Users/a1/projects/project-c"
)

for project in "${PROJECTS[@]}"; do
  echo "配置 $project ..."
  cd "$project"
  bash "$REPOTUTOR_PATH/scripts/setup-repotutor.sh" -y
done

echo "所有项目配置完成!"
```

### 自定义讲解风格

在使用 `/tutor` 命令时,你可以请求 Claude:

```
/tutor

请用简洁的风格讲解这个仓库的核心架构,重点关注:
1. 系统设计模式
2. 关键抽象层
3. 数据流向
```

### 指定讲解内容

```
/tutor

请只讲解以下模块:
- 用户认证系统 (src/auth/)
- API 路由层 (src/routes/)
- 数据库模型 (src/models/)
```

## 常见问题

### Q: 为什么没有语音?

**A:** 检查 GEMINI_API_KEY 是否设置:

```bash
echo $GEMINI_API_KEY
```

如果为空,设置环境变量:

```bash
export GEMINI_API_KEY="your-key-here"
# 并重启 Claude Code
```

### Q: IDE 导航不工作?

**A:** 确保你使用的是支持的 IDE:
- ✅ VSCode
- ✅ Cursor
- ✅ Qoder

并且 IDE 正在运行。

### Q: MCP 服务器无法启动?

**A:** 验证 MCP 服务器已构建:

```bash
cd /path/to/repotutor
npm run build

# 检查构建产物
ls mcp-servers/*/dist/index.js
```

### Q: 如何更新 RepoTutor?

**A:** 拉取最新代码并重新构建:

```bash
cd /path/to/repotutor
git pull
npm run build

# 然后在目标项目中重新运行配置脚本
cd /path/to/your/project
bash /path/to/repotutor/scripts/setup-repotutor.sh -y
```

### Q: 如何卸载?

**A:** 删除配置文件:

```bash
cd /path/to/your/project
rm .mcp.json
rm -rf .repotutor

# 手动从 ~/.claude.json 中移除对应的 enabledMcpjsonServers 配置
```

## 贡献

欢迎提交 Issue 和 Pull Request!

RepoTutor 项目地址: https://github.com/your-username/repotutor

## 许可证

MIT License

---

**开始使用 RepoTutor,让 AI 为你讲解代码吧!** 🚀
