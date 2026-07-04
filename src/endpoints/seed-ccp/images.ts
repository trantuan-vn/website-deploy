import fs from 'fs/promises'
import path from 'path'

import type { File } from 'payload'

export const PUBLIC_IMAGES = {
  heroHome: 'toanha_vsd.jpg',
  heroHome2: 'congnghe_vsd.jpg',
  heroHome3: 'keniem20nam.jpg',
  heroPost: 'keniem20nam.jpg',
} as const

export const IMAGE_URLS = {
  heroAbout:
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920',
  heroModel:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920',
  heroRisk:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920',
  heroRoadmap:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920',
  metaDefault:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
} as const

export const MEDIA_ALT = {
  heroHome: 'Tòa nhà VSD — hạ tầng thị trường vốn',
  heroHome2: 'Công nghệ VSD — hệ thống bù trừ và lưu ký',
  heroHome3: 'Kỷ niệm 20 năm VSD',
  heroPost: 'Kỷ niệm 20 năm VSD',
  heroAbout: 'Hội nghị thị trường chứng khoán — đối tác institution',
  heroModel: 'Sơ đồ luồng giao dịch chứng khoán',
  heroRisk: 'Biểu đồ quản trị rủi ro tài chính',
  heroRoadmap: 'Lộ trình phát triển — timeline',
  metaDefault: 'Logo placeholder CCP VN',
} as const

export async function fetchFileFromPublic(filename: string): Promise<File> {
  const filePath = path.join(process.cwd(), 'public', filename)
  const data = await fs.readFile(filePath)
  const ext = filename.split('.').pop() || 'jpg'

  return {
    name: filename,
    data: Buffer.from(data),
    mimetype: `image/${ext === 'webp' ? 'webp' : 'jpeg'}`,
    size: data.length,
  }
}

export async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()
  const ext = url.includes('unsplash') ? 'jpg' : url.split('.').pop() || 'jpg'

  return {
    name: `ccp-${Date.now()}.${ext}`,
    data: Buffer.from(data),
    mimetype: `image/${ext === 'webp' ? 'webp' : 'jpeg'}`,
    size: data.byteLength,
  }
}
