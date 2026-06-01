# Review Covers

Review Covers 是课程 Review 项目的 3D 作品封面星空展示页。首页会读取 Review Worker 的公开 `GET /api/bootstrap` 数据，把 `works[].coverUrl` 映射成沿星图路线自动飞行展示的封面卡片。

## 功能

- 自动读取 Review 公开作品封面数据。
- 最多展示 100 个作品封面。
- 页面加载后自动沿路线往返播放，不需要 Guide 或开始按钮。
- 右下角可调节飞行速度、卡片尺寸和飞行跨度。
- 远处封面按距离懒加载并回收纹理，避免一次性加载过重。
- 点击封面可打开对应作品链接。

## 数据源

默认数据源：

```text
https://review-api.saintmob.workers.dev/api/bootstrap
```

可通过环境变量覆盖 API base：

```bash
VITE_REVIEW_API_BASE="https://review-api.saintmob.workers.dev"
```

公开展示只依赖 Review Worker。仓库内的 `/admin` 和本地 API 仍保留，用于旧的 Firebase 投稿管理流程，不影响公开封面流。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:3000/
```

如果端口被占用，可以指定其他端口：

```bash
npm run dev -- --port=3001
```

## 检查与构建

```bash
npm run lint
npm run build
```

`npm run build` 只构建前端静态资源；`npm run dev:full` 会同时启动旧本地 API 和 Vite 开发服务。

## 环境变量

常用：

```bash
VITE_REVIEW_API_BASE="https://review-api.saintmob.workers.dev"
```

旧管理后台相关：

```bash
VITE_API_BASE=""
API_PORT="3102"
FIREBASE_SERVICE_ACCOUNT_JSON="..."
FIREBASE_PROJECT_ID="..."
FIREBASE_STORAGE_BUCKET="..."
FIREBASE_SUBMISSIONS_COLLECTION="designerSubmissions"
```
