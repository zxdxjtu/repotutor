---
description: 跳转到指定的讲解章节或模块
---

# 跳转讲解

跳转到指定的章节或模块继续讲解。

## 使用方法

```
/tutor-goto overview      # 跳转到项目概览
/tutor-goto architecture  # 跳转到系统架构
/tutor-goto auth          # 跳转到认证模块
/tutor-goto api           # 跳转到 API 模块
```

## 参数

$ARGUMENTS

解析用户指定的目标位置。

## 执行操作

1. 停止当前播放（如果有）
2. 在讲解大纲中查找匹配的章节/模块
3. 如果找到匹配：
   - 更新会话状态到新位置
   - 定位到新章节的第一个代码检查点
   - 开始该章节的讲解
4. 如果未找到：
   - 显示可用的章节列表
   - 提示用户选择

## 可用章节

显示当前仓库的讲解大纲，列出所有可跳转的章节：

```
可用章节:
1. overview     - 项目概览
2. architecture - 系统架构
3. modules      - 核心模块
   3.1 auth     - 认证模块
   3.2 api      - API 模块
   3.3 database - 数据库模块
4. quickstart   - 入门指南
```
