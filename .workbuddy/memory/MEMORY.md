# 项目长期记忆

## 仓库与部署约定（StarYunFan 个人站点）
- 源码仓库：`https://github.com/eksct/StarYunFan.git`，分支 `master`。
- 构建产物仓库（GitHub Pages）：`https://github.com/eksct/StarYunFanSite.git`，分支 `master`，站点根路径 `/StarYunFanSite/`（vite `base`）。
- CI：`.github/workflows/deploy.yml` 在 `master` 推送时构建并部署；推外部仓库需用 PAT 密钥 `secrets.PERSONAL_TOKEN`（repo 权限），`external_repository: eksct/StarYunFanSite`，`publish_branch: master`。
- `dist/` 已被 `.gitignore` 忽略，源码仓不含构建产物；产物独立推到 StarYunFanSite。
- 手动部署产物做法：克隆 StarYunFanSite → 清空旧文件（保留 .git）→ 拷入 dist → 提交 → 普通 push（勿强推，保留历史）。

## 主题机制（重要坑）
- 主题用 `<html data-theme="light|dark">` 属性驱动（见 `src/composables/useTheme.ts` + `tokens.css` 的 `:root[data-theme="dark"]`）。**Tailwind 的 `dark:` 变体默认对不上**（它看 `.dark` 类/系统偏好），写 `dark:` 工具类不会生效——暗色样式必须走 CSS 变量或 `:root[data-theme="dark"]` 选择器。
- `index.html` 头部有内联脚本在首屏绘制前定 `data-theme`，消除深色闪白（FOUC）。`main.ts` 也会再调一次 `applyTheme()`。
- 暗色文字对比度：原 `--c-text-3:#6f7480` 在 `#0f1115` 深底上仅约 3.7:1（看不清），已提亮为 `#99a1ae`（约 7:1）；`--c-text-2`→`#b4bac6`、`--c-text`→`#eef1f6`。
- 暗色 Voronoi 背景定稿「夜窗」：格子 L 24–31%/S 30–44%/op 0.5、**无暗幕**（灰蓝暗幕会把彩块糊成脏灰）、铅条提亮 `rgba(236,241,249,0.42)`；浅色维持原 pastel + 白色暗角。

## 页面结构
- 路由：`/`、`/about`、`/notes`、`/notes/:path`、`/tools`、`/projects`、404。时间线页已删除，由工具页替代；工具数据在 `src/content/site.ts` 的 `tools` 数组。
- projects 只保留「StarYunFan 个人站」一张卡片；`milestones` 导出已随时间线页一并移除（笔记页内部的时间线视图切换保留）。

## 环境注意
- 本机 git 走 HTTPS 推送 github.com 被代理持续拦截：`CONNECT tunnel failed 502` / `schannel SSL/TLS failed`（写入和 fetch 握手都拦，读取 ls-remote 偶发也拦）。**绕过法：SSH 通道可达且已配 key**——用 `GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git push ssh://git@github.com/eksct/StarYunFan.git master` 或 `git@github.com:eksct/StarYunFan.git` 即可成功；推完用 `git fetch ssh://.../<repo>.git master:refs/remotes/origin/master` 刷新 tracking。不可直接改用户 origin 的 remote URL（保留其 HTTPS 配法）。
