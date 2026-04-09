import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface AppData {
  version: number
  familyId: string
  familyCode: string
  babyName: string
  updatedAt: string
  records: { id: string; at: string; amountMl: number; by: string; notes?: string[] }[]
  quickAmounts?: number[]
  presetTags?: string[]
  colorMap?: Record<string, string>
  birthDate?: string
  growthRecords?: { id: string; date: string; weightKg?: number; heightCm?: number; headCm?: number; notes?: string }[]
}

function generateFamilyId(): string {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function generateFamilyCode(): string {
  // 6位纯数字
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

function dataKey(familyId: string) {
  return `family:${familyId}`
}

function avatarKey(familyId: string) {
  return `family:${familyId}:avatar`
}

function codeKey(code: string) {
  return `code:${code}`
}

async function getFamilyData(familyId: string): Promise<AppData> {
  const data = await redis.get<AppData>(dataKey(familyId))
  if (!data) throw new Error('家庭数据不存在')
  return data
}

async function setFamilyData(familyId: string, data: AppData): Promise<void> {
  data.updatedAt = new Date().toISOString()
  await redis.set(dataKey(familyId), data)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const familyId = req.query.familyId as string
      if (!familyId) return res.status(400).json({ ok: false, error: '缺少 familyId' })
      const data = await getFamilyData(familyId)
      // 不再在主数据中返回头像，头像通过 get_avatar 单独获取
      const { babyAvatar: _removed, ...dataWithoutAvatar } = data
      return res.json(dataWithoutAvatar)
    }

    if (req.method === 'POST') {
      const { action, record, recordId, data: fullData, familyId, babyName, familyCode, quickAmounts, colorMap, babyAvatar, birthDate, growthRecord, growthRecordId } = req.body

      if (action === 'create_family') {
        const newId = generateFamilyId()
        const code = generateFamilyCode()
        const newData: AppData = {
          version: 1,
          familyId: newId,
          familyCode: code,
          babyName: babyName || '小宝',
          updatedAt: new Date().toISOString(),
          records: [],
          quickAmounts: [40, 50, 60, 70, 80, 90, 100, 110],
        }
        await redis.set(dataKey(newId), newData)
        await redis.set(codeKey(code), newId)
        return res.json({ ok: true, familyId: newId, familyCode: code })
      }

      if (action === 'join_family') {
        if (!familyCode) return res.status(400).json({ ok: false, error: '请输入家庭码' })
        const existingFamilyId = await redis.get<string>(codeKey(familyCode))
        if (!existingFamilyId) return res.status(404).json({ ok: false, error: '家庭码不存在' })
        const data = await getFamilyData(existingFamilyId)
        return res.json({ ok: true, familyId: existingFamilyId, familyCode, babyName: data.babyName })
      }

      // 以下操作都需要 familyId
      if (!familyId) return res.status(400).json({ ok: false, error: '缺少 familyId' })

      // 头像独立存储，不需要加载主数据
      if (action === 'get_avatar') {
        const avatar = await redis.get<string>(avatarKey(familyId))
        return res.json({ ok: true, babyAvatar: avatar || null })
      } else if (action === 'set_avatar') {
        if (babyAvatar) {
          await redis.set(avatarKey(familyId), babyAvatar)
        } else {
          await redis.del(avatarKey(familyId))
        }
        return res.json({ ok: true })
      }

      const data = await getFamilyData(familyId)

      if (action === 'add') {
        data.records.push(record)
        if (colorMap) {
          data.colorMap = { ...(data.colorMap ?? {}), ...colorMap }
        }
      } else if (action === 'update') {
        data.records = data.records.map(r => r.id === record.id ? record : r)
      } else if (action === 'delete') {
        data.records = data.records.filter(r => r.id !== recordId)
      } else if (action === 'update_settings') {
        if (quickAmounts) data.quickAmounts = quickAmounts
        if (babyAvatar !== undefined) {
          // 头像单独存储到独立 key
          if (babyAvatar) {
            await redis.set(avatarKey(familyId), babyAvatar)
          } else {
            await redis.del(avatarKey(familyId))
          }
        }
        if (birthDate !== undefined) data.birthDate = birthDate || undefined
      } else if (action === 'add_growth') {
        if (!data.growthRecords) data.growthRecords = []
        data.growthRecords.push(growthRecord)
      } else if (action === 'delete_growth') {
        data.growthRecords = (data.growthRecords ?? []).filter(r => r.id !== growthRecordId)
      } else if (action === 'full_save') {
        await setFamilyData(familyId, fullData)
        return res.json({ ok: true })
      }

      await setFamilyData(familyId, data)
      return res.json({ ok: true, data })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
}
