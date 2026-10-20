# 部署指南

## 仓库与分支

- 源码仓库：`eksct/StarYunFan`
- 发布仓库：`eksct/StarYunFanSite`
- 构建检查：源码仓库推送到 `master` 或创建 Pull Request 时运行测试和构建
- 部署触发：发布仓库的同步工作流每 15 分钟读取源码仓库 `master`；也可在 Actions 中手动运行
- 发布目标：发布仓库的 `master` 分支根目录

## 配置 GitHub Pages

在发布仓库 `eksct/StarYunFanSite` 的 Settings → Pages 中，将发布来源设为 `Deploy from a branch`，选择 `master` 和 `/ (root)`。

发布仓库中的 `Sync source site` 工作流会检出公开源码、运行测试和构建，再将 `dist/` 更新到发布仓库的 `master` 根目录。它使用发布仓库自己的 `GITHUB_TOKEN`，无需跨仓库 PAT。发布仓库需保持 Pages 发布源为 `master` 分支根目录。

## 本地开发与构建

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

Node.js 版本要求为 20.19+ 或 22.13+，pnpm 使用 11.19.0。

## 故障排除

### 构建失败

检查 Node.js 与 pnpm 版本，并查看源码仓库 Actions 的构建日志。跨仓库发布失败时，查看发布仓库 `Sync source site` 的运行记录。

### 页面无法访问

确认发布仓库 Pages 发布 `master` 分支根目录，并检查最近一次源码仓库 Actions 是否成功。

### 笔记无法加载

确认 Markdown 文件位于 `public/postDir/`，编码为 UTF-8。

## 更新内容

将更改推送到源码仓库 `master` 分支。源码仓库会先运行构建检查；发布仓库通常在 15 分钟内同步。需要立即发布时，在 `StarYunFanSite` 的 Actions 页面手动运行 `Sync source site`。
