---
description: RepoTutor - 代码仓库智能讲解工具。自动分析代码仓库并提供语音讲解。
---

# RepoTutor - 代码仓库智能讲解

欢迎使用 RepoTutor！这是一个智能代码讲解工具，可以自动分析代码仓库并通过语音为你讲解代码。

## 使用方法

### 启动讲解

```
/tutor                           # 分析当前仓库并开始讲解
/tutor --docs ./docs/README.md   # 使用现有文档作为讲解基础
/tutor --resume                  # 继续上次的讲解
```

### 讲解控制

```
/tutor-pause     # 暂停讲解
/tutor-continue  # 继续讲解
/tutor-stop      # 停止讲解并保存进度
/tutor-goto      # 跳转到指定模块
/tutor-status    # 查看当前进度
/tutor-config    # 配置管理
```

## 参数说明

$ARGUMENTS

解析用户输入的参数：
- 如果包含 `--docs` 或 `-d`：使用指定的文档路径
- 如果包含 `--resume` 或 `-r`：继续上次讲解
- 如果包含 `--help` 或 `-h`：显示帮助信息

## 执行流程

### Phase 1: 分析仓库

1. 检查是否存在 `.repotutor/` 目录
2. 如果不存在或需要重新生成：
   - 分析代码仓库结构
   - 识别主要模块和入口点
   - 生成架构文档 (Mermaid 图)
   - 生成讲解大纲和脚本
   - 生成代码检查点

3. 如果提供了 `--docs` 参数：
   - 读取现有文档
   - 与代码进行比对验证
   - 生成补充的讲解脚本

### Phase 2: 初始化讲解会话

1. 加载讲解大纲 (`outline.json`)
2. 恢复或创建会话状态
3. 验证 MCP 服务可用性

### Phase 3: 交互式讲解

对于每个讲解段落：

1. 读取讲解脚本内容
2. 获取关联的代码检查点
3. 调用 IDE 控制定位到代码：
   ```
   使用 repotutor-ide-control MCP 的 goto_location 工具
   参数: file=检查点文件, line=检查点行号
   ```
4. 等待 500ms 确保 IDE 响应
5. 调用 TTS 合成语音：
   ```
   使用 repotutor-tts MCP 的 synthesize_speech 工具
   参数: text=讲解文本
   ```
6. 调用音频播放：
   ```
   使用 repotutor-audio-player MCP 的 play 工具
   参数: audioPath=合成的音频路径
   ```
7. 等待播放完成或用户中断
8. 如果用户暂停，保存当前位置并等待

### Phase 4: 处理用户交互

- **暂停**: 保存当前位置，等待用户提问或继续
- **提问**: 基于当前代码上下文回答问题
- **跳转**: 切换到用户指定的模块或章节
- **停止**: 保存进度，可下次继续

## 讲解内容结构

讲解按由粗到细的层次组织：

1. **项目概览** (5-10分钟)
   - 项目用途和目标
   - 技术栈介绍
   - 目录结构说明

2. **系统架构** (10-15分钟)
   - 整体架构图
   - 核心模块关系
   - 数据流向

3. **核心模块详解** (每模块 5-10分钟)
   - 模块职责
   - 主要类/函数
   - 关键实现细节

4. **入门指南** (5分钟)
   - 如何运行项目
   - 如何进行修改
   - 常见问题

## 配置选项

通过 `/tutor-config` 命令管理：

```
/tutor-config voice Kore         # 设置语音
/tutor-config style tutorial     # 设置讲解风格
/tutor-config lang zh-CN         # 设置语言
/tutor-config depth standard     # 设置讲解深度
```

## 文件存储

所有讲解相关文件存储在 `.repotutor/` 目录：

```
.repotutor/
├── wiki/              # 生成的文档
├── lecture/           # 讲解脚本和大纲
│   ├── outline.json   # 讲解大纲
│   ├── scripts/       # 讲解脚本
│   └── checkpoints.json
├── session/           # 会话状态
├── audio_cache/       # 音频缓存
└── config.json        # 配置文件
```

## 开始讲解

现在开始分析你的代码仓库...

首先检查环境：
1. 确认 GEMINI_API_KEY 环境变量已设置
2. 检测可用的 IDE (VSCode/Cursor/Qoder)
3. 验证 MCP 服务可用性

如果一切就绪，将开始分析仓库结构并生成讲解内容。
