// Turns whatever was pasted into the photo link box into a link the website
// can show: a direct image address works as is; links to photo pages on
// Pexels and Unsplash, and Google Images result links, are converted.
// Returns { src } or { error }, plus an optional { note } for the user.

const PAGE_HELP = 'Open the photo, right-click it and choose “Copy image address” (on a phone: press and hold the photo → “Copy image”), then paste that here.'

export function normalizeImageLink(input) {
  let text = String(input || '').trim().replace(/^["'<(]+|[">)']+$/g, '')
  if (!text) return { src: '' }
  if (/^data:/i.test(text)) return { error: 'This is a copied picture, not a link. Save it to your computer and use Upload instead.' }
  if (/^\/(?!\/)/.test(text)) return { src: text } // a file on this website, e.g. /uploads/photo.jpg
  if (/^\/\//.test(text)) text = `https:${text}`
  if (!/^[a-z]+:\/\//i.test(text)) text = `https://${text}`

  let url
  try { url = new URL(text) } catch { return { error: 'This does not look like a web address.' } }
  let note = ''
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    note = 'Changed to a secure (https) link.'
  }
  if (url.protocol !== 'https:') return { error: 'The link must start with https://' }
  const host = url.hostname.replace(/^www\./, '')

  // Google Images: “Copy link address” gives a Google page with the picture's address inside.
  if (/^google\.[a-z.]+$/.test(host) && url.pathname === '/imgres' && url.searchParams.get('imgurl')) {
    return normalizeImageLink(url.searchParams.get('imgurl'))
  }
  if (/^google\.[a-z.]+$/.test(host)) return { error: `This is a link to a Google page, not to the photo. ${PAGE_HELP}` }

  // Pexels photo page: pexels.com/photo/some-name-1234567/
  const pexels = host === 'pexels.com' && url.pathname.match(/^\/(?:[a-z-]+\/)?photo\/(?:.*-)?(\d+)\/?$/)
  if (pexels) {
    const id = pexels[1]
    return { src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`, note: 'Pexels page link converted to the photo.' }
  }

  // Unsplash photo page: unsplash.com/photos/some-name-AbC123xyz
  const unsplash = host === 'unsplash.com' && url.pathname.match(/^\/photos\/(?:.*-)?([A-Za-z0-9_-]{11})\/?$/)
  if (unsplash) {
    return { src: `https://unsplash.com/photos/${unsplash[1]}/download?force=true&w=1600`, note: 'Unsplash page link converted to the photo. If it does not show, use “Copy image address” on the photo instead.' }
  }
  if (host === 'unsplash.com' || host === 'pexels.com') return { error: `This is a link to a page, not to one photo. ${PAGE_HELP}` }

  return { src: url.toString(), note }
}

export const IMAGE_LINK_HELP = 'Paste a photo link from Unsplash, Pexels, Google Images or any website. In Google Images, open the photo, right-click it and choose “Copy image address”.'
