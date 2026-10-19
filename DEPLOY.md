# 部署指南

## 仓库与分支

- 源码仓库：`eksct/StarYunFan`
- 发布仓库：`eksct/StarYunFanSite`
- 部署触发：推送到源码仓库的 `master` 分支；Pull Request 只构建，不发布
- 发布目标：发布仓库的 `master` 分支根目录

## 配置 GitHub Pages

在发布仓库 `eksct/StarYunFanSite` 的 Settings → Pages 中，将发布来源设为 `Deploy from a branch`，选择 `master` 和 `/ (root)`。

在源码仓库 `eksct/StarYunFan` 的 Settings → Secrets and variables → Actions 中添加 `PERSONAL_TOKEN`。该令牌需要有权限向发布仓库推送内容。工作流通过 `peaceiris/actions-gh-pages` 将 `dist/` 发布到目标仓库。

## 本地开发与构建

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

Node.js 版本要求为 20.19+ 或 22.12+，pnpm 使用 11.19.0。

## 故障排除

### 构建失败

检查 Node.js 与 pnpm 版本，并查看源码仓库 Actions 的构建日志。

### 页面无法访问

确认发布仓库 Pages 发布 `master` 分支根目录，并检查最近一次源码仓库 Actions 是否成功。

### 笔记无法加载

确认 Markdown 文件位于 `public/postDir/`，编码为 UTF-8。

## 更新内容

将更改推送到源码仓库 `master` 分支。Actions 构建成功后会更新发布仓库，随后等待 GitHub Pages 刷新。
