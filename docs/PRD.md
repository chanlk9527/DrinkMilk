# 宝宝喝奶记录 - 产品需求文档 (PRD)

## 1. 产品概述

**产品名称：** 宝宝喝奶记录（DrinkMilk）

**产品定位：** 面向新生儿家庭的协作式喂奶记录工具，支持多位家庭成员实时共享记录宝宝的每一次喂奶数据。

**目标用户：** 新生儿家庭中参与喂养的所有成员（爸爸、妈妈、奶奶、姥姥等）。

**核心价值：**
- 多人协作：通过家庭码邀请家人，所有人共享同一份记录
- 快捷记录：一键点击预设奶量，3 秒完成一次记录
- 实时统计：距离上次喂奶时间、今日喂奶次数和总量一目了然
- 随时可用：PWA 支持，可添加到手机桌面，离线缓存

---

## 2. 技术架构

### 2.1 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 5.4 | 构建工具 |
| Tailwind CSS | 4.2 | 样式方案 |
| React Router DOM | 7.14 | 客户端路由（Hash 模式） |

### 2.2 后端

| 技术 | 用途 |
|------|------|
| Vercel Serverless Functions | API 运行时 |
| Upstash Redis | 数据持久化（云端 KV 存储） |
| Google Apps Script（备选） | 替代后端方案，使用 Google Drive 存储 |

### 2.3 部署

- 平台：Vercel
- 前端：Vite 构建静态资源，CDN 分发
- 后端：`api/data.ts` 自动部署为 Serverless Function
- 环境变量：`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`

---

## 3. 数据模型

### FeedRecord（喂奶记录）

```typescript
{
  id: string        // 唯一标识，格式：r_{timestamp36}_{random}
  at: string        // ISO 8601 时间戳
  amountMl: number  // 奶量（毫升）
  by: string        // 记录人称呼
}
```

### AppData（家庭数据）

```typescript
{
  version: number        // 数据版本号（当前为 1）
  familyId: string       // 家庭唯一标识，格式：f_{timestamp36}_{random}
  familyCode: string     // 6 位数字家庭码，用于邀请加入
  babyName: string       // 宝宝昵称
  updatedAt: string      // 最后更新时间
  records: FeedRecord[]  // 所有喂奶记录
  quickAmounts?: number[] // 自定义快捷奶量按钮
}
```

### LocalSettings（本地设置）

```typescript
{
  myName: string      // 当前用户称呼
  babyName: string    // 宝宝昵称
  familyId: string    // 当前家庭 ID
  familyCode: string  // 当前家庭码
  setupDone: boolean  // 是否完成初始设置
}
```

### Redis 存储结构

| Key 格式 | Value | 说明 |
|-----------|-------|------|
| `family:{familyId}` | AppData JSON | 家庭完整数据 |
| `code:{6位数字}` | familyId 字符串 | 家庭码到家庭 ID 的映射 |

---

## 4. 功能模块

### 4.1 初始设置（Setup）

**入口条件：** 首次打开应用或本地设置未完成

**流程 A - 创建新家庭：**
1. 用户输入宝宝昵称
2. 选择或自定义自己的称呼（预设：爸爸、妈妈、奶奶、姥姥）
3. 系统生成 familyId 和 6 位家庭码
4. 初始化家庭数据并存入 Redis
5. 保存本地设置，进入主界面

**流程 B - 加入已有家庭：**
1. 用户输入 6 位家庭码
2. 选择或自定义自己的称呼
3. 系统通过家庭码查找对应家庭
4. 获取家庭数据（含宝宝昵称）
5. 保存本地设置，进入主界面

### 4.2 首页（Home）

**核心展示：**
- 距离上次喝奶时间（每 30 秒自动刷新）
- 上次喂奶详情：时间、奶量、记录人
- 今日统计：喂奶次数、总奶量

**快捷记录：**
- 8 个预设奶量按钮（默认：40/50/60/70/80/90/100/110 ml，可自定义）
- 点击后弹出确认弹窗，确认即记录
- 乐观更新：先更新本地 UI 和缓存，再同步到服务端

**自定义记录：**
- 底部弹出面板
- 可输入任意奶量和指定时间
- 时间默认为当前时间

**最近记录：**
- 时间线样式展示最近 5 条记录
- 显示奶量、记录人、时间

### 4.3 历史记录（History）

- 按日期分组展示所有记录（倒序）
- 每日汇总：次数和总奶量
- 时间线 UI 风格
- 点击记录进入内联编辑模式
- 支持修改奶量和时间
- 支持删除记录（需确认）

### 4.4 设置（Settings）

- 家庭码展示与复制（用于邀请家人）
- 修改宝宝昵称
- 修改个人称呼
- 快捷奶量编辑（添加/删除/重置，对整个家庭生效）
- 手动刷新数据
- 应用版本信息和记录总数

---

## 5. API 接口

统一入口：`/api/data`

### GET 请求

| 参数 | 说明 |
|------|------|
| `familyId` | 家庭 ID |

返回对应家庭的完整 AppData。

### POST 请求

| action | 参数 | 说明 |
|--------|------|------|
| `create_family` | `babyName` | 创建新家庭 |
| `join_family` | `familyCode` | 通过家庭码加入 |
| `add` | `familyId`, `record` | 添加喂奶记录 |
| `update` | `familyId`, `record` | 更新喂奶记录 |
| `delete` | `familyId`, `recordId` | 删除喂奶记录 |
| `update_settings` | `familyId`, `quickAmounts` | 更新快捷奶量 |
| `full_save` | `familyId`, `data` | 全量覆盖家庭数据 |

---

## 6. 设计规范

### 色彩体系

| 名称 | 色值 | 用途 |
|------|------|------|
| cream | `#FFF8F0` | 页面背景 |
| warm-400 | `#FFA04D` | 主色调 |
| warm-500 | `#E8863A` | 主色调深色 |
| text | `#4A3728` | 正文文字 |
| text-light | `#8B7355` | 辅助文字 |
| card | `#FFFFFF` | 卡片背景 |
| danger | `#E85D5D` | 危险操作 |

### 设计特点

- 暖色调奶油风格，营造温馨家庭氛围
- 移动端优先，适配安全区域（刘海屏、底部横条）
- 圆角卡片 + 渐变按钮
- 底部 Tab 导航（首页/记录/设置）
- 底部弹出面板交互
- 时间线风格的记录列表

### PWA 支持

- `manifest.json` 配置 standalone 模式
- Apple Touch Icon 支持
- 主题色与背景色统一为 `#FFF8F0`

---

## 7. 离线与缓存策略

- 本地设置存储于 `localStorage`（key: `milk_settings`）
- 家庭数据缓存于 `localStorage`（key: `milk_data_cache`）
- 采用乐观更新策略：操作先更新本地状态和缓存，再异步同步服务端
- 同步失败时显示错误提示，支持手动重试
- 旧版本设置自动检测并重置

---

## 8. 备选后端方案

项目包含 Google Apps Script 实现（`apps-script/Code.gs`），可作为零成本替代方案：

- 数据存储在 Google Drive 文件中
- 索引文件：`baby-milk-index.json`（家庭码映射）
- 家庭数据文件：`family-{familyId}.json`
- 部署为 Web 应用，前端通过 `VITE_API_URL` 环境变量指向
- API 接口与 Vercel 版本完全一致
