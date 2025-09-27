# Seiga 个人主页

一个现代化的个人主页，包含关于我、笔记展示等功能。

## 功能特性

- 🏠 **首页** - 个人介绍和欢迎信息
- 👤 **关于** - 个人技能、经历和兴趣爱好
- 📚 **笔记** - Markdown 笔记展示和管理
- 🎨 **现代化设计** - 毛玻璃效果、渐变色彩、响应式布局
- 📱 **移动端适配** - 完全响应式设计

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + SCSS
- **Markdown 解析**: marked + highlight.js
- **路由**: Vue Router
- **状态管理**: Pinia

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

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 "GitHub Actions" 作为部署源
4. 每次推送到 main 分支时自动部署

## 笔记管理

笔记文件存放在 `src/assets/postDir/` 目录下，支持：

- 按分类组织笔记
- 搜索功能
- 语法高亮
- 响应式阅读体验

## 项目结构

```
src/
├── assets/
│   ├── postDir/          # Markdown 笔记文件
│   ├── img/              # 图片资源
│   └── scss/             # 样式文件
├── Component/            # 公共组件
├── stores/               # Pinia 状态管理
├── utils/                # 工具函数
├── view/                 # 页面组件
│   ├── welcome/          # 首页
│   ├── about/            # 关于页面
│   └── notes/            # 笔记页面
└── router/               # 路由配置
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
