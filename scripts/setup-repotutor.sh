#!/bin/bash

# RepoTutor 自动配置脚本
# 用途: 为任意代码仓库快速配置 RepoTutor 讲解系统
# 使用方法: cd /path/to/your/repo && bash /path/to/repotutor/scripts/setup-repotutor.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 获取脚本所在目录 (RepoTutor 根目录)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOTUTOR_ROOT="$(dirname "$SCRIPT_DIR")"

# 目标仓库目录 (当前工作目录)
TARGET_REPO="$(pwd)"
TARGET_REPO_NAME="$(basename "$TARGET_REPO")"

# 支持非交互模式 (通过 -y 或 --yes 参数)
NON_INTERACTIVE=false
if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]]; then
    NON_INTERACTIVE=true
fi

print_header "RepoTutor 自动配置工具"

echo -e "RepoTutor 路径: ${GREEN}$REPOTUTOR_ROOT${NC}"
echo -e "目标仓库路径: ${GREEN}$TARGET_REPO${NC}"
echo -e "目标仓库名称: ${GREEN}$TARGET_REPO_NAME${NC}\n"

# ============================================
# 步骤 1: 环境检查
# ============================================
print_header "步骤 1/5: 环境检查"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装 (需要 >= 18.0.0)"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js 已安装: $NODE_VERSION"

# 检查 npm
if ! command -v npm &> /dev/null; then
    print_error "npm 未安装"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm 已安装: $NPM_VERSION"

# 检查 TypeScript
if ! command -v tsc &> /dev/null; then
    print_warning "TypeScript 未全局安装，将使用 RepoTutor 本地版本"
fi

# 检查 GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    print_warning "GEMINI_API_KEY 环境变量未设置"
    print_info "TTS 功能需要此密钥。请在 ~/.zshrc 或 ~/.bashrc 中添加:"
    echo -e "  ${YELLOW}export GEMINI_API_KEY='your-api-key-here'${NC}\n"

    if [ "$NON_INTERACTIVE" = false ]; then
        read -p "是否继续配置 (无 API Key 时 TTS 将不可用)? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "配置已取消"
            exit 1
        fi
    else
        print_info "非交互模式: 自动继续 (TTS 将不可用)"
    fi
else
    print_success "GEMINI_API_KEY 已设置"
fi

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    print_warning "当前目录不是 Git 仓库"
    if [ "$NON_INTERACTIVE" = false ]; then
        read -p "是否继续? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "配置已取消"
            exit 1
        fi
    else
        print_info "非交互模式: 自动继续"
    fi
fi

# ============================================
# 步骤 2: 构建 RepoTutor MCP 服务器
# ============================================
print_header "步骤 2/5: 构建 RepoTutor MCP 服务器"

cd "$REPOTUTOR_ROOT"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    print_info "安装 RepoTutor 依赖..."
    npm install
    print_success "依赖安装完成"
else
    print_success "RepoTutor 依赖已存在"
fi

# 检查是否需要构建
BUILD_NEEDED=false
for mcp_server in tts-mcp ide-control-mcp audio-player-mcp; do
    if [ ! -f "mcp-servers/$mcp_server/dist/index.js" ]; then
        BUILD_NEEDED=true
        break
    fi
done

if [ "$BUILD_NEEDED" = true ]; then
    print_info "构建 MCP 服务器..."
    npm run build
    print_success "MCP 服务器构建完成"
else
    print_success "MCP 服务器已构建"
fi

# 验证构建结果
for mcp_server in tts-mcp ide-control-mcp audio-player-mcp; do
    if [ ! -f "mcp-servers/$mcp_server/dist/index.js" ]; then
        print_error "构建失败: mcp-servers/$mcp_server/dist/index.js 不存在"
        exit 1
    fi
done

cd "$TARGET_REPO"

# ============================================
# 步骤 3: 生成 .mcp.json 配置文件
# ============================================
print_header "步骤 3/5: 生成 .mcp.json 配置文件"

MCP_CONFIG_FILE="$TARGET_REPO/.mcp.json"

if [ -f "$MCP_CONFIG_FILE" ]; then
    print_warning ".mcp.json 已存在"
    if [ "$NON_INTERACTIVE" = false ]; then
        read -p "是否覆盖? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "跳过 .mcp.json 生成"
        else
            rm "$MCP_CONFIG_FILE"
        fi
    else
        print_info "非交互模式: 保留现有 .mcp.json"
    fi
fi

if [ ! -f "$MCP_CONFIG_FILE" ]; then
    cat > "$MCP_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "repotutor-tts": {
      "command": "node",
      "args": ["$REPOTUTOR_ROOT/mcp-servers/tts-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "\${GEMINI_API_KEY}"
      }
    },
    "repotutor-ide-control": {
      "command": "node",
      "args": ["$REPOTUTOR_ROOT/mcp-servers/ide-control-mcp/dist/index.js"]
    },
    "repotutor-audio-player": {
      "command": "node",
      "args": ["$REPOTUTOR_ROOT/mcp-servers/audio-player-mcp/dist/index.js"]
    }
  }
}
EOF
    print_success ".mcp.json 已生成: $MCP_CONFIG_FILE"
fi

# ============================================
# 步骤 4: 更新 Claude Code 配置
# ============================================
print_header "步骤 4/5: 更新 Claude Code 配置"

CLAUDE_CONFIG="$HOME/.claude.json"

if [ ! -f "$CLAUDE_CONFIG" ]; then
    print_warning "Claude Code 配置文件不存在: $CLAUDE_CONFIG"
    print_info "请确保已安装 Claude Code"
    print_info "跳过 Claude Code 配置更新"
else
    print_info "需要手动更新 Claude Code 配置"
    print_warning "请按照以下步骤操作:"
    echo
    echo -e "${YELLOW}1. 重启 Claude Code${NC}"
    echo -e "${YELLOW}2. 在 Claude Code 中运行: /mcp${NC}"
    echo -e "${YELLOW}3. 找到以下 3 个 MCP 服务器并启用它们:${NC}"
    echo -e "   - repotutor-tts"
    echo -e "   - repotutor-ide-control"
    echo -e "   - repotutor-audio-player"
    echo
    print_info "或者,可以手动编辑 $CLAUDE_CONFIG"
    print_info "在对应项目的 enabledMcpjsonServers 数组中添加:"
    echo -e "${YELLOW}  \"enabledMcpjsonServers\": [${NC}"
    echo -e "${YELLOW}    \"repotutor-tts\",${NC}"
    echo -e "${YELLOW}    \"repotutor-ide-control\",${NC}"
    echo -e "${YELLOW}    \"repotutor-audio-player\"${NC}"
    echo -e "${YELLOW}  ]${NC}"
    echo
fi

# ============================================
# 步骤 5: 创建 .gitignore 条目
# ============================================
print_header "步骤 5/5: 更新 .gitignore"

GITIGNORE_FILE="$TARGET_REPO/.gitignore"

# 需要添加到 .gitignore 的条目
GITIGNORE_ENTRIES=(
    ".repotutor/"
    ".mcp.json"
)

if [ ! -f "$GITIGNORE_FILE" ]; then
    print_warning ".gitignore 不存在,创建新文件"
    touch "$GITIGNORE_FILE"
fi

for entry in "${GITIGNORE_ENTRIES[@]}"; do
    if grep -q "^$entry$" "$GITIGNORE_FILE" 2>/dev/null; then
        print_info ".gitignore 已包含: $entry"
    else
        echo "$entry" >> "$GITIGNORE_FILE"
        print_success "已添加到 .gitignore: $entry"
    fi
done

# ============================================
# 配置完成
# ============================================
print_header "配置完成! 🎉"

echo -e "${GREEN}RepoTutor 已成功配置到仓库: $TARGET_REPO_NAME${NC}\n"

print_info "下一步操作:"
echo -e "  ${YELLOW}1.${NC} 重启 Claude Code"
echo -e "  ${YELLOW}2.${NC} 在 Claude Code 中运行 ${BLUE}/mcp${NC} 启用 3 个 MCP 服务器"
echo -e "  ${YELLOW}3.${NC} 使用 Claude Code 运行 ${BLUE}/tutor${NC} 命令开始代码讲解"
echo

print_info "MCP 服务器说明:"
echo -e "  ${BLUE}repotutor-tts${NC}         - 语音合成 (需要 GEMINI_API_KEY)"
echo -e "  ${BLUE}repotutor-ide-control${NC} - IDE 导航 (VSCode/Cursor/Qoder)"
echo -e "  ${BLUE}repotutor-audio-player${NC} - 音频播放 (macOS afplay)"
echo

if [ -z "$GEMINI_API_KEY" ]; then
    print_warning "记得设置 GEMINI_API_KEY 环境变量以启用 TTS 功能"
    echo -e "  ${YELLOW}export GEMINI_API_KEY='your-api-key'${NC}"
    echo
fi

print_success "配置脚本执行完成!"
