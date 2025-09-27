# 部署指南

## GitHub Pages 部署

### 1. 准备工作

1. 确保项目已推送到 GitHub 仓库
2. 确保仓库是公开的（GitHub Pages 免费版只支持公开仓库）

### 2. 启用 GitHub Pages

1. 进入仓库的 Settings 页面
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "GitHub Actions"
4. 保存设置

### 3. 配置 GitHub Actions

项目已包含 `.github/workflows/deploy.yml` 文件，会自动：

- 在推送到 main 分支时触发构建
- 安装依赖并构建项目
- 将构建结果部署到 GitHub Pages

### 4. 自定义域名（可选）

如果需要使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名，例如：`example.com`
3. 在域名服务商处配置 CNAME 记录指向 `username.github.io`

### 5. 环境变量

如果需要环境变量，在仓库 Settings > Secrets and variables > Actions 中添加：

- `GITHUB_TOKEN`: 通常不需要手动设置，GitHub 会自动提供

## 本地测试

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

## 故障排除

### 构建失败

1. 检查 Node.js 版本（推荐 18+）
2. 检查 pnpm 版本
3. 查看 GitHub Actions 日志

### 页面无法访问

1. 确认 GitHub Pages 已启用
2. 检查仓库是否为公开
3. 等待几分钟让 DNS 生效

### Markdown 文件无法加载

1. 确认文件路径正确
2. 检查文件编码（推荐 UTF-8）
3. 确认文件在 `src/assets/postDir/` 目录下

## 更新内容

每次更新内容后：

1. 提交更改到 main 分支
2. GitHub Actions 会自动构建和部署
3. 等待几分钟后访问网站查看更新

## 性能优化

- 图片优化：使用 WebP 格式
- 代码分割：Vite 已自动处理
- 缓存策略：GitHub Pages 自动处理静态资源缓存
