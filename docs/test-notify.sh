#!/bin/bash

# 测试通知服务的 Shell 脚本
# 使用方法: ./test-notify.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 加载 .env 文件
if [ -f .env ]; then
  echo -e "${BLUE}📄 加载 .env 配置文件...${NC}"
  export $(cat .env | grep -v '^#' | xargs)
else
  echo -e "${YELLOW}⚠️  未找到 .env 文件，使用默认配置${NC}"
  export MASTER_URL=${MASTER_URL:-http://127.0.0.1:8079}
fi

echo -e "${BLUE}🎯 测试目标: ${MASTER_URL}${NC}"
echo ""

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "${BLUE}[测试 ${TOTAL_TESTS}] ${test_name}${NC}"

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${MASTER_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "${MASTER_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ 通过 (状态码: ${status_code})${NC}"
    echo -e "  响应: ${body}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ 失败 (期望: ${expected_status}, 实际: ${status_code})${NC}"
    echo -e "  响应: ${body}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  echo ""
  sleep 1
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  开始测试通知服务${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 测试 1: 健康检查
test_endpoint \
  "健康检查端点" \
  "GET" \
  "/health" \
  "" \
  "200"

# 测试 2: question 类型通知
test_endpoint \
  "发送 question 类型通知" \
  "POST" \
  "/notify" \
  '{
    "title": "测试问题",
    "message": "这是一个测试问题通知",
    "project": "/Users/test/project",
    "cwd": "project",
    "type": "question",
    "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' \
  "200"

# 测试 3: success 类型通知
test_endpoint \
  "发送 success 类型通知" \
  "POST" \
  "/notify" \
  '{
    "title": "测试成功",
    "message": "这是一个测试成功通知",
    "project": "/Users/test/project",
    "cwd": "project",
    "type": "success",
    "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' \
  "200"

# 测试 4: error 类型通知
test_endpoint \
  "发送 error 类型通知" \
  "POST" \
  "/notify" \
  '{
    "title": "测试错误",
    "message": "这是一个测试错误通知",
    "project": "/Users/test/project",
    "cwd": "project",
    "type": "error",
    "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' \
  "200"

# 测试 5: info 类型通知
test_endpoint \
  "发送 info 类型通知" \
  "POST" \
  "/notify" \
  '{
    "title": "测试信息",
    "message": "这是一个测试信息通知",
    "project": "/Users/test/project",
    "cwd": "project",
    "type": "info",
    "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' \
  "200"

# 输出测试结果摘要
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  测试结果摘要${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}🎉 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 有 ${FAILED_TESTS} 个测试失败${NC}"
  exit 1
fi
