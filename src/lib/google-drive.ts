/**
 * API 层 - 调用 Vercel Serverless Function + Upstash Redis
 */
import type { AppData, FeedRecord } from './types'
import { getSettings } from './storage'

const API_URL = import.meta.env.VITE_API_URL || '/api/data'

function getFamilyId(): string {
  return getSettings().familyId
}

export async function loadData(): Promise<AppData> {
  const resp = await fetch(`${API_URL}?familyId=${getFamilyId()}`)
  if (!resp.ok) throw new Error('读取数据失败')
  return resp.json()
}

export async function addRecord(record: FeedRecord, colorMap?: Record<string, string>): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', familyId: getFamilyId(), record, colorMap }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '保存失败')
  return result.data
}

export async function updateRecord(record: FeedRecord): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', familyId: getFamilyId(), record }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '更新失败')
  return result.data
}

export async function deleteRecord(recordId: string): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', familyId: getFamilyId(), recordId }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '删除失败')
  return result.data
}

export async function createFamily(babyName: string): Promise<{ familyId: string; familyCode: string }> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_family', babyName }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '创建失败')
  return { familyId: result.familyId, familyCode: result.familyCode }
}

export async function joinFamily(familyCode: string): Promise<{ familyId: string; familyCode: string; babyName: string }> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join_family', familyCode }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '加入失败')
  return { familyId: result.familyId, familyCode: result.familyCode, babyName: result.babyName }
}

export async function updateFamilySettings(settings: { quickAmounts?: number[]; birthDate?: string | null }): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_settings', familyId: getFamilyId(), ...settings }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '更新设置失败')
  return result.data
}

export async function getAvatar(): Promise<string | null> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_avatar', familyId: getFamilyId() }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '获取头像失败')
  return result.babyAvatar
}

export async function setAvatar(babyAvatar: string | null): Promise<void> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_avatar', familyId: getFamilyId(), babyAvatar }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '保存头像失败')
}

import type { GrowthRecord } from './types'

export async function addGrowthRecord(growthRecord: GrowthRecord): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_growth', familyId: getFamilyId(), growthRecord }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '保存失败')
  return result.data
}

export async function deleteGrowthRecord(growthRecordId: string): Promise<AppData> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_growth', familyId: getFamilyId(), growthRecordId }),
  })
  const result = await resp.json()
  if (!result.ok) throw new Error(result.error || '删除失败')
  return result.data
}
