---
description: 配置 RepoTutor 的讲解选项
---

# 讲解配置

管理 RepoTutor 的讲解配置选项。

## 使用方法

```
/tutor-config                    # 显示当前配置
/tutor-config voice Kore         # 设置语音
/tutor-config style tutorial     # 设置讲解风格
/tutor-config lang zh-CN         # 设置语言
/tutor-config depth detailed     # 设置讲解深度
```

## 参数

$ARGUMENTS

解析配置项和值。

## 可配置选项

### 语音 (voice)

可用语音：
- `Kore` - 坚定、专业（默认，推荐用于技术讲解）
- `Zephyr` - 明亮、活泼
- `Puck` - 积极向上
- `Fenrir` - 兴奋
- `Enceladus` - 轻柔

设置方式：
```
/tutor-config voice Kore
```

### 讲解风格 (style)

可用风格：
- `professional` - 专业、清晰、简洁
- `tutorial` - 循序渐进、详细解释（默认）
- `quick` - 快速概览、重点突出
- `storytelling` - 娓娓道来、有趣生动

设置方式：
```
/tutor-config style tutorial
```

### 语言 (lang)

可用语言：
- `zh-CN` - 简体中文（默认）
- `en-US` - 英语

设置方式：
```
/tutor-config lang zh-CN
```

### 讲解深度 (depth)

可用深度：
- `overview` - 概览级别，只讲主要结构
- `standard` - 标准级别（默认）
- `detailed` - 详细级别，深入每个函数

设置方式：
```
/tutor-config depth standard
```

## 执行操作

1. 如果没有参数，显示当前所有配置
2. 如果有参数，更新指定的配置项：
   - 验证配置值是否有效
   - 更新 `.repotutor/config.json`
   - 如果是语音或风格，同时更新 TTS 配置：
     ```
     使用 repotutor-tts MCP 的 set_default_config 工具
     ```
3. 显示更新后的配置

## 配置文件

配置保存在 `.repotutor/config.json`：

```json
{
  "voice": "Kore",
  "style": "tutorial",
  "language": "zh-CN",
  "depth": "standard"
}
```
