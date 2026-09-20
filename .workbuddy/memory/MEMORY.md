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

## 环境注意
- 本机 git 推送 github.com 偶发代理 502（CONNECT tunnel failed），遇此重试或待网络恢复再 push；读取（fetch/ls-remote）通常正常。
