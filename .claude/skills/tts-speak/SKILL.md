---
name: tts-speak
description: 将文本转换为语音并播放。用于讲解代码时的语音输出。支持暂停、继续、停止控制。关键词：语音、朗读、播放、讲解、说话、TTS。
---

# TTS 语音朗读 Skill

此 Skill 允许你将文本转换为语音并播放给用户听，用于代码讲解场景。

## 功能

### 1. 语音合成并播放

**完整流程**：
1. 使用 `repotutor-tts` MCP 合成语音
2. 使用 `repotutor-audio-player` MCP 播放音频

### 2. 合成语音 (synthesize_speech)

**调用方式**：
使用 `repotutor-tts` MCP 服务器的 `synthesize_speech` 工具。

参数：
- `text`: 要转换为语音的文本
- `voice`: 语音名称（可选，默认 Kore）
- `style`: 语音风格（可选，如 "专业、清晰"）

返回：
- `audioId`: 音频 ID
- `audioPath`: 音频文件路径
- `durationMs`: 预估时长（毫秒）

### 3. 播放音频 (play)

**调用方式**：
使用 `repotutor-audio-player` MCP 服务器的 `play` 工具。

参数：
- `audioPath`: 音频文件路径（从 synthesize_speech 获取）

### 4. 暂停/继续/停止

- `pause`: 暂停当前播放
- `resume`: 继续播放
- `stop`: 停止播放
- `get_status`: 获取播放状态

## 可用语音

| 语音名称 | 特点 |
|---------|------|
| Kore | 坚定、专业 - 推荐用于技术讲解 |
| Zephyr | 明亮、活泼 |
| Puck | 积极向上 |
| Fenrir | 兴奋 |
| Aoede | 活泼 |
| Enceladus | 轻柔 |

## 使用模式

### 模式 1：简单语音播放

```
1. 调用 synthesize_speech(text="欢迎来到项目讲解...")
2. 获取 audioPath
3. 调用 play(audioPath)
```

### 模式 2：配合 IDE 控制的讲解

```
1. 调用 ide-control 的 goto_location 定位代码
2. 等待 500ms
3. 调用 synthesize_speech 合成讲解文本
4. 调用 play 播放语音
5. 等待播放完成或用户中断
6. 继续下一段讲解
```

### 模式 3：处理用户暂停

```
用户发送暂停信号 →
1. 调用 pause 暂停播放
2. 等待用户输入问题
3. 回答问题
4. 调用 resume 或开始新的讲解
```

## 讲解文本编写指南

为获得最佳语音效果，讲解文本应：

1. **使用自然语言**
   - 好：让我们来看看这个入口函数
   - 差：现在展示 src/index.ts 第 1-20 行

2. **适当分段**
   - 每段讲解控制在 2-3 句话
   - 便于用户理解和中断

3. **引用代码时用描述**
   - 好：这里的 createServer 函数负责...
   - 差：第 15 行的 createServer 函数...

4. **保持节奏**
   - 重要概念后稍作停顿（使用句号或逗号）
   - 避免一口气说太多内容

## 注意事项

- 语音合成需要网络连接（Gemini API）
- 首次合成可能有 1-2 秒延迟
- 音频文件会缓存，相同文本不会重复合成
- macOS 使用 afplay，Linux 使用 aplay
