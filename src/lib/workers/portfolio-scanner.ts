import * as cheerio from 'cheerio'

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

export async function scanPortfolio(portfolioUrl: string): Promise<string[]> {
  if (!isValidUrl(portfolioUrl)) {
    throw new Error(`Invalid portfolio URL: ${portfolioUrl}`)
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(portfolioUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BuildCanada/1.0)' },
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Failed to fetch ${portfolioUrl}: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const companyLinks: string[] = []
    const seen = new Set<string>()

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      if (!isValidUrl(href)) return

      const normalizedHref = normalizeUrl(href)

      if (seen.has(normalizedHref)) return
      seen.add(normalizedHref)

      const skipPatterns = [/twitter\.com/, /linkedin\.com/, /facebook\.com/, /youtube\.com/, /github\.com/]
      if (skipPatterns.some(pattern => pattern.test(normalizedHref))) return

      companyLinks.push(normalizedHref)
    })

    return companyLinks
  } catch (error) {
    throw new Error(`Portfolio scan failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}