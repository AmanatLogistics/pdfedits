// Shrinks a photo in the browser before upload: uploads are limited to a few
// megabytes and smaller images also make the website faster.
export async function prepareImage(file, { maxSize = 2000, quality = 0.84 } = {}) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Please choose a JPG, PNG, WebP or GIF image.')
  if (file.type === 'image/gif') {
    if (file.size > 3_000_000) throw new Error('GIF images must be smaller than 3 MB.')
    return { type: file.type, dataUrl: await readAsDataUrl(file) }
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  // Keep PNG for logos and graphics with transparency, JPEG for photos.
  const keepPng = file.type === 'image/png' && hasTransparency(ctx, w, h)
  const type = keepPng ? 'image/png' : 'image/jpeg'
  const dataUrl = canvas.toDataURL(type, quality)
  if (dataUrl.length > 4_000_000) throw new Error('This image is still too large after resizing. Please use a smaller one.')
  return { type, dataUrl }
}

function hasTransparency(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h)
  for (let i = 3; i < data.length; i += 4 * 16) if (data[i] < 250) return true
  return false
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Could not read the file.'))
    r.readAsDataURL(file)
  })
}
