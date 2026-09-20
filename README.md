# Seiga 个人主页

一个纯前端的个人站：首页、关于、笔记归档、时间线、项目。没有后端，数据要么是构建期生成的静态清单，要么是仓库里的配置文件。

## 功能特性

- **首页** - 个人介绍、社交链接、最近更新的笔记
- **关于** - 简历式页面：技能、经历、教育、兴趣
- **笔记** - Markdown 笔记按时间线归档，支持搜索与分类筛选；阅读页带大纲、代码复制、上下篇
- **时间线** - 学习历程 + 笔记的月度归档
- **项目** - 作品集卡片
- **简约设计** - 单一强调色、统一圆角、轻描边，毛玻璃只用在顶栏与浮层
- **主题切换** - 浅色 / 深色，默认跟随系统偏好，手动切换后记住选择
- **移动端适配** - 完全响应式

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS（仅作基础层）+ SCSS 设计令牌
- **Markdown 解析**: markdown-it + highlight.js（按需注册语言）
- **路由**: Vue Router（hash 模式，适配 GitHub Pages）

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

开发环境要求 Node.js 20.19+（推荐 24.x）和 pnpm 11.19.0。

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 "GitHub Actions" 作为部署源
4. 每次推送到 main 分支时自动部署

## 笔记管理

笔记文件放在 `public/postDir/`，开发或构建时 `scripts/generate-notes-manifest.mjs` 会递归扫描并生成 `src/generated/noteManifest.ts`，包含路径、标题、分类、日期、字数、标签与摘要。

**日期来源**：优先读笔记 frontmatter 里的 `date`，没有则用文件的修改时间。目前的笔记是整库复制进来的，文件时间全都一样，所以归档里日期会集中显示；想让时间线有真实分布，在笔记顶部加上：

```markdown
---
date: 2025-03-10
tags: [Redis]
---
```

支持的 frontmatter 字段：`title`、`date`、`category`、`tags`、`description`。

正文兼容 Obsidian 语法：`![[图片]]` 和 `[[双链]]` 会自动转成图片与站内链接。

## 站点内容

`src/content/site.ts` 是所有个人信息的唯一来源：昵称、简介、技能、经历、时间线节点、项目、社交链接。里面标注 `TODO` 的条目是占位内容，需要换成真实信息。

## 项目结构

```
src/
├── assets/scss/          # tokens.css 设计令牌 / base.css 基础层 / prose.css 正文排版
├── composables/          # useTheme 主题状态
├── content/              # site.ts 站点内容配置
├── generated/            # 自动生成的笔记与图片清单
├── Component/            # 导航栏等公共组件
├── utils/                # notes.ts 清单查询 / markdown.ts 渲染
├── view/                 # 页面组件
│   ├── welcome/          # 首页
│   ├── about/            # 关于
│   ├── notes/            # 笔记归档 + NoteReader 阅读页
│   ├── timeline/         # 时间线
│   ├── projects/         # 项目
│   └── not-found/        # 404
└── router/               # 路由配置

public/postDir/            # Markdown 笔记及其附件
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
