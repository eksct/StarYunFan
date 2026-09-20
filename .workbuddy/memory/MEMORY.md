# 项目长期记忆

## 仓库与部署约定（StarYunFan 个人站点）
- 源码仓库：`https://github.com/eksct/StarYunFan.git`，分支 `master`。
- 构建产物仓库（GitHub Pages）：`https://github.com/eksct/StarYunFanSite.git`，分支 `master`，站点根路径 `/StarYunFanSite/`（vite `base`）。
- CI：`.github/workflows/deploy.yml` 在 `master` 推送时构建并部署；推外部仓库需用 PAT 密钥 `secrets.PERSONAL_TOKEN`（repo 权限），`external_repository: eksct/StarYunFanSite`，`publish_branch: master`。
- `dist/` 已被 `.gitignore` 忽略，源码仓不含构建产物；产物独立推到 StarYunFanSite。
- 手动部署产物做法：克隆 StarYunFanSite → 清空旧文件（保留 .git）→ 拷入 dist → 提交 → 普通 push（勿强推，保留历史）。

## 环境注意
- 本机 git 推送 github.com 偶发代理 502（CONNECT tunnel failed），遇此重试或待网络恢复再 push；读取（fetch/ls-remote）通常正常。
