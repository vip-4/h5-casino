# H5 Casino / Slot Game - 生产级部署配置

## 技术栈

- **前端**: Next.js 14 + React 18 + Tailwind CSS
- **数据库**: Neon Serverless PostgreSQL
- **认证**: Session-based (简化演示)
- **游戏引擎**: 原生 DOM + 服务端 RNG (HMAC-SHA256)
- **边缘**: Cloudflare CDN + WAF
- **部署**: Vercel Edge Network
- **CI/CD**: GitHub Actions

## 生产环境状态

- **GitHub**: https://github.com/vip-4/h5-casino
- **Vercel**: https://h5-casino.vercel.app
- **Neon Project**: `polished-sound-81352481`
- **Database**: `neondb` (neondb_owner)

## 项目结构

```
h5-casino/
├── src/
│   ├── app/
│   │   ├── (game)/slot/page.tsx      # 游戏主页面
│   │   ├── api/
│   │   │   ├── spin/route.ts         # 旋转 API
│   │   │   ├── balance/route.ts      # 余额查询
│   │   │   └── leaderboard/route.ts  # 排行榜
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/SlotMachine.tsx    # 老虎机组件
│   ├── lib/
│   │   ├── db.ts                     # Neon 连接
│   │   ├── auth.ts                   # 认证工具
│   │   ├── rng.ts                    # 服务端随机数
│   │   └── game-engine.ts            # 游戏逻辑
│   └── store/gameStore.ts            # Zustand 状态
├── .github/workflows/
│   ├── ci.yml                        # CI 流水线
│   ├── deploy.yml                    # 部署流水线
│   └── db-migrate.yml                # 数据库迁移
├── Dockerfile
├── docker-compose.yml
├── next.config.js
└── package.json
```

## 快速开始

### 1. 克隆与安装

```bash
cd C:\storygames\h5-casino
npm install
```

### 2. 数据库配置

#### 选项 A: 本地 PostgreSQL

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 初始化数据库
npm run db:push
```

#### 选项 B: Neon Cloud (生产)

1. 在 [neon.tech](https://neon.tech) 创建项目
2. 复制连接字符串到 `.env.local`

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 3. 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/h5_casino?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
INITIAL_BALANCE=10000
MAX_BET=1000
MIN_BET=10
```

### 4. 数据库 Schema

```sql
-- 在 Neon SQL Editor 或 psql 中执行
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 10000,
  vip_level INT DEFAULT 0,
  total_spins INT DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bet BIGINT NOT NULL,
  result JSONB NOT NULL,
  payout BIGINT NOT NULL,
  is_win BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jackpot (
  id SERIAL PRIMARY KEY,
  pool BIGINT NOT NULL DEFAULT 0,
  seed TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_game_logs_user ON game_logs(user_id, created_at DESC);
CREATE INDEX idx_users_balance ON users(balance DESC);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000/game/slot

## Neon 分支工作流（Magic Circle 模式）

本项目采用类似 Magic Circle 的 Neon 分支策略，实现零干扰的并行开发：

### 1. PR 自动创建分支

每次创建 PR 时，GitHub Actions 会自动：
1. 从 `main` 分支创建 Neon 数据库分支 `pr-{number}`
2. 在 PR 中评论分支详情和连接字符串
3. 自动运行迁移和测试
4. PR 合并/关闭时自动删除分支

### 2. 开发者本地分支

每个开发者可以创建自己的开发分支：

```bash
# Linux/Mac
export NEON_API_KEY="your-api-key"
bash scripts/dev-branch.sh dev-yourname

# Windows PowerShell
$env:NEON_API_KEY = "your-api-key"
.\scripts\dev-branch.ps1 dev-yourname
```

### 3. 分支结构

```
main (production)
├── pr-1 (feature/login)
├── pr-2 (feature/slot)
├── dev-alice
└── dev-bob
```

### 4. 快速回滚

```bash
# 从特定时间点恢复
neonctl branches create rollback-$(date +%Y%m%d) --parent main --timestamp "2 hours ago"
```

## 部署到生产环境

### 已完成的部署

- **生产 URL**: https://h5-casino.vercel.app
- **Vercel 项目**: 886/h5-casino
- **项目 ID**: `prj_BlhZK66DTubbkA17BOL9patzjePT`
- **Org ID**: `886`

### GitHub Actions CI/CD

本仓库已配置 GitHub Actions 自动部署流水线：

1. **CI** (`.github/workflows/ci.yml`): PR 时自动运行测试、类型检查、构建
2. **Deploy** (`.github/workflows/deploy.yml`): 推送到 main 时自动部署到 Vercel
3. **DB Migration** (`.github/workflows/db-migrate.yml`): 数据库 schema 变更时自动迁移

### GitHub Secrets 配置

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 | 获取方式 |
|--------|------|----------|
| `VERCEL_TOKEN` | Vercel API Token | `vercel tokens ls` |
| `VERCEL_ORG_ID` | Vercel 组织 ID | `886` |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | `prj_BlhZK66DTubbkA17BOL9patzjePT` |
| `NEON_DATABASE_URL` | Neon 连接字符串 | Neon Console → Connection Details |
| `NEON_API_KEY` | Neon API Key | Neon Console → API Keys |
| `NEON_PROJECT_ID` | Neon 项目 ID | `polished-sound-81352481` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID | Cloudflare Dashboard → Domain → Overview |
| `SLACK_WEBHOOK` | Slack 通知 Webhook | Slack → Apps → Incoming Webhooks |

### Cloudflare Workers 挂机游戏后端

本项目包含完整的 H5 挂机游戏后端，基于 Cloudflare Workers + Hono + D1 构建：

#### 架构

```
Cloudflare Workers (Hono)
├── D1 Database (玩家数据、装备、背包)
├── KV Cache (排行榜、会话)
└── Edge Network (全球低延迟)
```

#### 快速部署

```bash
# 进入 Cloudflare 目录
cd cloudflare

# 安装依赖
npm install

# 创建 D1 数据库
wrangler d1 create zyg-h5game-db

# 运行迁移
wrangler d1 execute zyg-h5game-db --file=migrations/001_initial.sql
wrangler d1 execute zyg-h5game-db --file=migrations/seed.sql

# 本地开发
wrangler dev

# 部署到生产
wrangler deploy
```

#### 游戏 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/player/info` | GET | 玩家信息 |
| `/api/map/list` | GET | 地图列表 |
| `/api/combat/start` | POST | 开始战斗 |
| `/api/combat/auto` | POST | 自动战斗 |
| `/api/inventory/list` | GET | 背包列表 |
| `/api/equipment/list` | GET | 装备列表 |
| `/api/enhance/start` | POST | 装备强化 |
| `/api/shop/buy` | POST | 购买物品 |
| `/api/rebirth/perform` | POST | 转生 |
| `/api/admin/users` | GET | 管理后台-用户列表 |
| `/api/admin/logs` | GET | 管理后台-战斗日志 |
| `/api/admin/maps` | POST | 管理后台-添加地图 |

#### 游戏特性

- **自动战斗系统**: 支持 10 连战快速刷怪
- **装备品质系统**: 普通/稀有/极品/神品/超神品
- **装备强化**: 概率成功，失败保留装备
- **转生系统**: 50 级转生获得永久属性加成
- **Admin 管理后台**: 玩家管理、地图管理、物品管理

#### GitHub Actions 自动部署

推送到 `main` 分支时自动部署 Cloudflare Workers：

```yaml
# .github/workflows/deploy-cloudflare.yml
name: Deploy Cloudflare Workers
on:
  push:
    branches: [main]
    paths:
      - 'cloudflare/**'
```

### Cloudflare 配置

#### 1. 域名接入

```bash
# 在 Cloudflare Dashboard 添加域名后，修改 Nameserver
# 或使用 Cloudflare CLI 导入 DNS 记录
```

#### 2. WAF 规则

```json
{
  "rules": [
    {
      "action": "block",
      "expression": "(http.request.uri.path contains \"/api/spin\") and ip.reputation in {suspicious}"
    },
    {
      "action": "challenge",
      "expression": "rate(1m, http.request.uri.path eq \"/api/spin\") > 100"
    }
  ]
}
```

#### 3. 缓存规则

| 路径 | 策略 |
|------|------|
| `/static/*` | Cache Everything, TTL 7d |
| `/api/*` | No Store |
| `/_next/static/*` | Cache Everything, TTL 1y |

### Neon 生产配置

1. 启用 Read Replicas
2. 设置连接池限制
3. 启用自动暂停
4. 配置备份策略

## API 接口

### POST /api/spin

请求体:
```json
{
  "betAmount": 100,
  "clientSeed": "abc123",
  "nonce": 123456789
}
```

响应:
```json
{
  "success": true,
  "reels": ["🍒", "🍋", "🍇"],
  "payout": 0,
  "newBalance": 9900,
  "isWin": false
}
```

### GET /api/balance

响应:
```json
{
  "balance": 9900,
  "totalSpins": 1,
  "totalWagered": 100
}
```

### GET /api/leaderboard?limit=10

响应:
```json
[
  {
    "email": "player@example.com",
    "balance": 50000,
    "total_wagered": 10000,
    "total_spins": 500
  }
]
```

## 安全特性

1. **服务端 RNG**: 所有随机数在服务端生成，防止客户端篡改
2. **原子扣款**: `UPDATE ... WHERE balance >= bet` 防止并发超扣
3. **会话认证**: Session token 存储在 HTTP-only Cookie
4. **输入校验**: 所有 API 参数严格校验
5. **WAF 防护**: Cloudflare 阻止恶意请求
6. **DDoS 防护**: Vercel + Cloudflare 自动扩容

## 性能优化

| 层级 | 优化 |
|------|------|
| 前端 | Next.js SSR + 静态资源 CDN |
| API | Vercel Edge Functions (冷启动 < 50ms) |
| 数据库 | Neon HTTP Driver (无连接池限制) |
| 缓存 | Cloudflare KV 缓存 Jackpot |
| 监控 | Vercel Analytics + Sentry |

## 故障排查

### 数据库连接失败

```bash
# 检查 Neon 连接
psql $DATABASE_URL -c "SELECT 1"

# 检查连接池
npm run db:ping
```

### 构建失败

```bash
# 清除缓存
rm -rf .next node_modules
npm install
npm run build
```

## 许可证

MIT