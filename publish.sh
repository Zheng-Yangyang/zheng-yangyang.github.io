#!/bin/bash

cd "$(dirname "$0")"

echo ""
echo "=============================="
echo "  Blog 发布助手"
echo "=============================="

# 显示改动文件
echo ""
echo "📝 本次改动："
git status --short
echo ""

# 如果没有改动就退出
if [ -z "$(git status --short)" ]; then
  echo "没有需要提交的改动。"
  exit 0
fi

# 输入提交信息
read -p "提交说明（回车跳过则自动生成）：" msg

if [ -z "$msg" ]; then
  # 自动生成：统计新增/修改的文章
  added=$(git status --short | grep "content/posts" | wc -l | tr -d ' ')
  if [ "$added" -gt 0 ]; then
    msg="更新博客文章 (${added} 篇)"
  else
    msg="更新博客内容"
  fi
fi

echo ""
echo "👉 提交信息：$msg"
read -p "确认发布？(y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消。"
  exit 0
fi

echo ""
git add .
git commit -m "$msg"

echo ""
echo "🚀 推送到 GitHub..."
git push

echo ""
echo "✅ 发布完成！约 1 分钟后上线："
echo "   https://zheng-yangyang.github.io"
echo ""
