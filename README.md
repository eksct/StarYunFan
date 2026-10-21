# Seiga 个人主页

基于 Vue 3、TypeScript 和 Vite 的纯静态个人站，包括首页、关于、笔记、工具、友链和项目。

访问：[eksct.github.io/StarYunFanSite](https://eksct.github.io/StarYunFanSite/)。

## 开发与构建

使用 Node.js >=22.13（推荐 24，见 `.node-version`）和 pnpm 11.19.0。

```sh
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
node scripts/verify-dist.mjs
pnpm preview
```

`build` 包含类型检查。`build-only` 和直接 `vite build` 同样执行公开内容校验、附件白名单、文章预渲染和静态页面生成。`pnpm generate-notes` 可单独刷新清单。开发服务器会在笔记变动后重新生成并刷新页面。

## 笔记发布

Markdown 与附件放在 `public/postDir/`。构建会生成公开笔记清单、按需加载的搜索 JSON、站内阅读 JSON、独立 HTML 文章、RSS 和 sitemap。浏览器无需下载 Markdown 解析器或代码高亮器。

Vite 的公开目录是自动生成的 `.generated-public/`。网站仅发布 `src/content/siteConfig.mjs` 中列出的根文件，以及公开文章实际引用的图片；不会直接复制笔记库，不会发布原始 Markdown、隐藏目录、Obsidian 配置、草稿或草稿专用附件。

支持的 frontmatter 字段：`title`、`publishedAt`、`updatedAt`、`date`、`category`、`tags`、`description`、`draft`。使用 YAML，字段名称、类型、日期及重复字段会在构建时检查。

```markdown
---
title: 缓存笔记
publishedAt: 2025-03-10
updatedAt: 2026-10-21
category: Java
tags: [Java, Cache]
description: 本地缓存的使用记录
draft: false
---
```

`draft: true` 的笔记不进入任何索引或发布产物。`test.md` 与分类为 `测试` 的笔记同样排除。`date` 兼容旧的发布日期写法；不填写日期时，发布日与更新日分别使用 Git 首次及最近提交日，无 Git 历史时回退到文件日期。批量导入的笔记如需真实写作日期，应显式填写。

正文支持标准 Markdown 链接、图片标题，以及 `![[图片]]`、`[[笔记路径|别名]]`、`[[笔记#标题]]`、`[[笔记#^块ID]]`。链接优先完整路径、当前文件夹相对路径，其次唯一后缀或唯一标题。同名歧义、未发布目标、缺失图片或失效锚点会阻止构建，代码示例中的链接语法不会被修改。页面只展示一个 H1，站内阅读与独立文章正文完全共用。

## 配置

- `src/content/site.ts`：个人资料、经历、项目、工具、友链与社交链接。
- `src/content/siteConfig.mjs`：站名、站点 URL、部署路径、公开根文件与分类/集合规则。
- `scripts/lib/`：构建期 Markdown 渲染、内容收集和静态页面生成。
- `src/generated/`：自动生成的笔记清单和元数据，请修改原始笔记。
- `docs/static-site-improvements.md`：本轮 18 项实现与验证说明。

## 部署

1. 源码推送至 `eksct/StarYunFan` 的 `master`；Actions 执行 lint、回归、构建、类型检查及产物校验。
2. `eksct/StarYunFanSite` 的同步工作流每 5 分钟检查源码变更，通过验证后更新发布分支。可在发布仓库 Actions 手动运行 `Sync source site` 提前触发。
3. 发布仓库的 GitHub Pages 使用 `master` 分支根目录。独立文章页提供 canonical、Open Graph 和 BlogPosting 元信息，适合直接分享。

同步工作流读取公开源码，不依赖跨仓库 PAT。站点不需要后台服务。
