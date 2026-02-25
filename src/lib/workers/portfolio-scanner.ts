import * as cheerio from 'cheerio'
import { createOrganization, getOrganizationByWebsite } from '@/lib/supabase/organizations'
import { queueOrganizationScan } from '@/lib/supabase/tasks'

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  const urlObj = new URL(url)
  if (urlObj.pathname === '/') {
    urlObj.pathname = '/'
  } else {
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '')
  }
  urlObj.search = ''
  urlObj.hash = ''
  return urlObj.toString()
}

export async function scanPortfolio(portfolioUrl: string, _sourceId: string): Promise<{ found: number; created: number }> {
  if (!isValidUrl(portfolioUrl)) {
    throw new Error(`Invalid portfolio URL: ${portfolioUrl}`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(portfolioUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BuildCanada/1.0)' },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${portfolioUrl}: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const seen = new Set<string>()
    let createdCount = 0
    let failedCount = 0

    for (const link of $('a[href]').toArray()) {
      const href = $(link).attr('href')
      if (!href) continue

      if (!isValidUrl(href)) continue

      const normalizedHref = normalizeUrl(href)

      if (seen.has(normalizedHref)) continue
      seen.add(normalizedHref)

      const skipPatterns = [/twitter\.com/, /linkedin\.com/, /facebook\.com/, /youtube\.com/, /github\.com/]
      if (skipPatterns.some(pattern => pattern.test(normalizedHref))) continue

      try {
        const existing = await getOrganizationByWebsite(normalizedHref)
        if (existing) continue

        await createOrganization({
          name: normalizedHref,
          city: null,
          province: null,
          country: null,
          address: null,
          description: null,
          website: normalizedHref,
          careers_page: null,
          canadian_status: 'unscanned',
        })

        await queueOrganizationScan(normalizedHref, normalizedHref)
        
        createdCount++
      } catch (error) {
        failedCount++
        console.error(`Failed to process ${normalizedHref}:`, error)
      }
    }

    console.log(`Portfolio scan: ${seen.size} links found, ${createdCount} orgs created, ${failedCount} failed`)
    return { found: seen.size, created: createdCount }
  } finally {
    clearTimeout(timeout)
  }
}