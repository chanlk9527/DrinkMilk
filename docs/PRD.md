# 宝宝喝奶记录 - 产品需求文档 (PRD)

## 1. 产品概述

**产品名称：** 宝宝喝奶记录（DrinkMilk）

**产品定位：** 面向新生儿家庭的协作式喂养记录与成长追踪工具，支持多位家庭成员实时共享记录宝宝的喂奶数据和成长指标。

**目标用户：** 新生儿家庭中参与喂养的所有成员（爸爸、妈妈、奶奶、姥姥等）。

**核心价值：**
- 多人协作：通过家庭码邀请家人，所有人共享同一份记录
- 快捷记录：一键点击预设奶量，3 秒完成一次记录
- 数据洞察：奶量趋势、喂奶间隔分布、单次奶量变化等多维统计图表
- 成长追踪：记录体重、身高、头围，可视化成长曲线
- 随时可用：PWA 支持，可添加到手机桌面，离线缓存
- 深夜友好：自动/手动深夜模式，夜间喂奶不刺眼

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
| Recharts | 3.8 | 数据可视化图表 |

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
  notes?: string[]  // 备注标签（预设标签 + 自定义备注）
}
```

### GrowthRecord（成长记录）

```typescript
{
  id: string          // 唯一标识
  date: string        // YYYY-MM-DD
  weightKg?: number   // 体重 (kg)
  heightCm?: number   // 身高 (cm)
  headCm?: number     // 头围 (cm)
  notes?: string      // 备注
}
```
