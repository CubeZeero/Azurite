'use server'

import * as cheerio from 'cheerio'

export interface OgpData {
    title?: string
    description?: string
    image?: string
    url?: string
    siteName?: string
}

export async function getOgp(url: string): Promise<OgpData | null> {
    try {
        // Simple validation
        if (!url.startsWith('http')) return null

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            signal: controller.signal,
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        clearTimeout(timeoutId)

        if (!res.ok) return null
        const html = await res.text()
        const $ = cheerio.load(html)

        const getMeta = (prop: string) =>
            $(`meta[property="${prop}"]`).attr('content') ||
            $(`meta[name="${prop}"]`).attr('content')

        const title = getMeta('og:title') || getMeta('twitter:title') || $('title').text()
        const description = getMeta('og:description') || getMeta('description') || getMeta('twitter:description')
        const image = getMeta('og:image') || getMeta('twitter:image')
        const siteName = getMeta('og:site_name') || getMeta('application-name')

        // If no title, it's likely not a useful page or blocked
        if (!title) return null

        return {
            title,
            description,
            image,
            url,
            siteName
        }
    } catch (e) {
        // console.error("OGP Fetch Error for URL:", url, e)
        return null
    }
}

