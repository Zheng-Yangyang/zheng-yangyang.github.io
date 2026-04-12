#!/bin/bash

cd "$(dirname "$0")"

echo ""
echo "=============================="
echo "  新建博客文章"
echo "=============================="

# 选择分类
echo ""
echo "请选择分类："
categories=("golang" "agent" "llm" "infra" "web")
for i in "${!categories[@]}"; do
  echo "  $((i+1)). ${categories[$i]}"
done
echo ""
read -e -p "输入编号 (1-${#categories[@]}): " cat_choice

if ! [[ "$cat_choice" =~ ^[1-9]$ ]] || [ "$cat_choice" -gt "${#categories[@]}" ]; then
  echo "无效选择，退出。"
  exit 1
fi
category="${categories[$((cat_choice-1))]}"

# 输入文章信息
echo ""
read -e -p "文章标题（中文或英文）: " title
if [ -z "$title" ]; then
  echo "标题不能为空，退出。"
  exit 1
fi

read -e -p "文章简介（一句话描述，可回车跳过）: " description

read -e -p "标签（多个用逗号分隔，如 goroutine,channel）: " tags_raw

# 生成目录名（取标题，转小写，空格换成-，去掉特殊字符）
dir_name=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]/-/g' | sed 's/[^a-z0-9-]//g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//')
# 如果目录名为空（纯中文可能被清空），用时间戳兜底
if [ -z "$dir_name" ]; then
  dir_name="post-$(date +%Y%m%d%H%M%S)"
fi

post_dir="content/posts/$category/$dir_name"

# 确认
echo ""
echo "------------------------------"
echo "  分类：$category"
echo "  标题：$title"
echo "  目录：$post_dir/"
[ -n "$description" ] && echo "  简介：$description"
[ -n "$tags_raw" ] && echo "  标签：$tags_raw"
echo "------------------------------"
read -e -p "确认创建？(y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消。"
  exit 0
fi

# 创建目录
mkdir -p "$post_dir/images"

# 格式化 tags 为 YAML 数组
tags_yaml=""
if [ -n "$tags_raw" ]; then
  IFS=',' read -ra tag_arr <<< "$tags_raw"
  tag_items=""
  for tag in "${tag_arr[@]}"; do
    tag=$(echo "$tag" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    tag_items="$tag_items\"$tag\", "
  done
  tags_yaml="[${tag_items%, }]"
else
  tags_yaml="[\"$category\"]"
fi

# 写入 index.md
cat > "$post_dir/index.md" << EOF
---
title: "$title"
date: $(date +%Y-%m-%d)
draft: false
tags: $tags_yaml
categories: ["$category"]
description: "$description"
ShowToc: true
TocOpen: true
---

## 概述



---

## 正文



---

## 总结


EOF

echo ""
echo "✅ 创建成功！"
echo ""
echo "   文件路径：$post_dir/index.md"
echo "   图片目录：$post_dir/images/"
echo ""
echo "用 Typora 打开："
echo "   open -a Typora $post_dir/index.md"
echo ""
read -e -p "现在用 Typora 打开？(y/n): " open_now
if [ "$open_now" = "y" ] || [ "$open_now" = "Y" ]; then
  open -a Typora "$post_dir/index.md"
fi
