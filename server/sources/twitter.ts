import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

/**
 * Twitter/X source implementation
 *
 * Note: Twitter's API requires authentication. This implementation uses
 * alternative methods to fetch trending content without API keys.
 *
 * Options:
 * 1. Use Nitter instances (privacy-friendly Twitter frontend)
 * 2. Scrape public Twitter pages
 * 3. Use RSSHub for Twitter feeds
 */

const trending = defineSource(async () => {
  // Try different Nitter instances as they often go down
  const nitterInstances = [
    "https://nitter.poast.org",
    "https://nitter.privacydev.net",
    "https://nitter.net",
  ]

  let lastError: Error | null = null

  // Try each Nitter instance
  for (const baseUrl of nitterInstances) {
    try {
      // Scrape Nitter's trending page
      const html: any = await myFetch(`${baseUrl}/search?f=tweets&q=%23trending`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      })

      const $ = cheerio.load(html)
      const news: NewsItem[] = []

      // Parse tweets from Nitter HTML
      $(".timeline-item").each((index, element) => {
        if (index >= 30) return false // Limit to 30 items

        const $tweet = $(element)
        const $link = $tweet.find(".tweet-link")
        const tweetPath = $link.attr("href")
        const $content = $tweet.find(".tweet-content")
        const text = $content.text().trim()
        const $username = $tweet.find(".username")
        const username = $username.text().trim()
        const $fullname = $tweet.find(".fullname")
        const fullname = $fullname.text().trim()

        if (tweetPath && text) {
          const tweetUrl = `https://twitter.com${tweetPath}`
          news.push({
            id: tweetPath,
            title: text.length > 100 ? `${text.substring(0, 100)}...` : text,
            url: tweetUrl,
            extra: {
              info: fullname || username,
              hover: text,
            },
          })
        }
      })

      if (news.length > 0) {
        return news
      }
    } catch (error) {
      lastError = error as Error
      console.warn(`Failed to fetch from ${baseUrl}:`, error)
      continue
    }
  }

  // If all instances failed, throw error
  throw new Error(`Unable to fetch Twitter trends. All Nitter instances failed. Last error: ${lastError?.message || "Unknown"}`)
})

const explore = defineSource(async () => {
  // Use RSSHub as a more reliable alternative
  // RSSHub provides Twitter feeds without requiring API keys
  const rssHubBase = "https://rsshub.app"

  try {
    const rssUrl = `${rssHubBase}/twitter/trends/1` // World trends (WOEID: 1)
    const data = await rss2json(rssUrl)

    if (!data?.items || data.items.length === 0) {
      // Fallback to trending
      return trending()
    }

    return data.items.slice(0, 30).map((item, index) => ({
      id: item.link || `twitter-explore-${index}`,
      title: item.title || "Untitled",
      url: item.link || "https://twitter.com",
      pubDate: item.created,
      extra: {
        info: item.author || undefined,
        hover: item.description || undefined,
      },
    }))
  } catch (error) {
    console.warn("RSSHub Twitter fetch failed, falling back to trending:", error)
    // Fallback to trending
    return trending()
  }
})

export default defineSource({
  "twitter": trending,
  "twitter-trending": trending,
  "twitter-explore": explore,
})
