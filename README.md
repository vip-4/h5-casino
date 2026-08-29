# H5 Casino / Slot Game - 本地部署配置

## 技术栈

- **前端**: Next.js 14 + React 18 + Tailwind CSS
- **数据库**: Neon Serverless PostgreSQL
- **认证**: NextAuth.js (Session-based)
- **游戏引擎**: 原生 Canvas / DOM + 服务端 RNG
- **边缘**: Cloudflare CDN + WAF
- **部署**: Vercel Edge Network

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

## 部署到生产环境

### Vercel 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### Cloudflare 配置

1. 在 Cloudflare Dashboard 添加域名
2. 配置 DNS 指向 Vercel
3. 启用 WAF 规则：
   - 速率限制: `/api/spin` 每分钟最多 60 次
   - 阻止恶意 IP
4. 配置缓存规则：
   - 静态资源: Cache Everything, TTL 7d

### Neon 生产配置

1. 启用 Read Replicas
2. 设置连接池限制
3. 启用自动暂停

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