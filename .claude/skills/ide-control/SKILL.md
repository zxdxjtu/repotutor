---
name: ide-control
description: 控制 IDE（VSCode/Cursor/Qoder）打开文件、定位代码行、高亮代码片段。当需要在讲解过程中展示代码时自动调用此 skill。关键词：打开文件、定位、跳转、显示代码、展示代码。
---

# IDE 控制 Skill

此 Skill 允许你控制用户的 IDE（VSCode、Cursor 或 Qoder）来展示代码。

## 功能

### 1. 定位代码 (goto_location)
打开指定文件并跳转到指定的行和列。

**使用场景**：
- 讲解某个函数时，需要展示函数的实现代码
- 演示代码结构时，需要跳转到特定位置
- 回答用户问题时，需要指向具体代码

**调用方式**：
使用 `repotutor-ide-control` MCP 服务器的 `goto_location` 工具。

参数：
- `file`: 文件的绝对路径
- `line`: 行号（从 1 开始）
- `column`: 列号（可选，从 1 开始）

### 2. 打开文件 (open_file)
在当前 IDE 窗口中打开文件（不指定位置）。

**调用方式**：
使用 `repotutor-ide-control` MCP 服务器的 `open_file` 工具。

### 3. 高亮代码范围 (highlight_range)
高亮指定的代码范围（当前仅支持定位到起始行）。

**调用方式**：
使用 `repotutor-ide-control` MCP 服务器的 `highlight_range` 工具。

参数：
- `file`: 文件的绝对路径
- `startLine`: 起始行号
- `endLine`: 结束行号

## 示例用法

当讲解代码时，按以下模式操作：

1. 先调用 IDE 控制定位到代码
2. 等待 IDE 响应
3. 然后进行语音讲解

```
思考：用户正在学习这个项目的入口文件，我需要：
1. 打开 src/index.ts 文件
2. 定位到第 1 行
3. 然后讲解这段代码

执行：调用 goto_location(file="src/index.ts", line=1)
```

## 注意事项

- 文件路径必须是绝对路径
- IDE 控制是异步的，定位后需要等待约 500ms 才能确保 IDE 响应
- 如果用户的 IDE 没有打开，命令会启动新的 IDE 窗口
