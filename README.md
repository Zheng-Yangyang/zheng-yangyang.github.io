# Yangyang's Notebook

独立设计的 Astro 静态博客，文章沿用 `content/posts/` 下的 Markdown。

## 开发

需要 Node.js 22。

```sh
npm ci
npm run dev
```

## 构建与检查

```sh
npm run build
npm run check
npm run preview
```

构建输出在 `dist/`。推送到 main 后，GitHub Actions 构建并发布到 GitHub Pages。

## 写文章

运行 `./new-post.sh`，或创建 `content/posts/分类/文章名/index.md`。文章图片放在相邻的 `images/` 目录，使用 `![说明](images/example.png)` 引用。支持 YAML frontmatter 的 title、date、description、tags 和 draft。draft 为 true 的文章不会发布。

原有文章路径 `/posts/分类/文章名/` 保持可用。新增内容会自动进入列表、搜索和 RSS。专题配置在 `src/lib/posts.ts`，页面在 `src/pages/`，样式在 `src/styles/global.css`。

之前的 Hugo 配置和主题作为迁移参考保留，当前开发、构建和部署均使用 Astro。
