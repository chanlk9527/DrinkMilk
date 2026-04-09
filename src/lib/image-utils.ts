/**
 * 压缩图片为指定尺寸的 base64 JPEG
 * 默认压缩到 200x200，质量 0.7，适合头像场景
 */
export function compressImage(
  file: File,
  maxSize = 200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 计算裁剪为正方形的区域（居中裁剪）
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2

      const canvas = document.createElement('canvas')
      canvas.width = maxSize
      canvas.height = maxSize
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}
