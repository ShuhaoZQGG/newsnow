import process from "node:process"
import * as cheerio from "cheerio"
import type { NewsItem } from "@newsnow/shared/types"

/**
 * Twitter/X source implementation
 *
 * Strategy (in order of preference):
 * 1. Use official Twitter API v2 if TWITTER_BEARER_TOKEN is provided
 * 2. Use RSSHub if Twitter credentials are configured
 * 3. Fallback to Nitter instances (privacy-friendly frontends)
 *
 * Environment variables:
 * - TWITTER_BEARER_TOKEN: Your Twitter API v2 Bearer Token (recommended)
 *   Get it from: https://developer.twitter.com/en/portal/dashboard
 *
 * Alternative (for RSSHub):
 * - TWITTER_AUTH_TOKEN: Your Twitter auth_token cookie
 * Or:
 * - TWITTER_USERNAME: Your Twitter username
 * - TWITTER_PASSWORD: Your Twitter password
 */

// Twitter API v2 configuration
interface TwitterV2Tweet {
  id: string
  text: string
  author_id?: string
  created_at?: string
}

interface TwitterV2Response {
  data?: TwitterV2Tweet[]
  includes?: {
    users?: Array<{
      id: string
      username: string
      name: string
    }>
  }
  meta?: {
    newest_id?: string
    oldest_id?: string
    result_count?: number
  }
}

// RSSHub instances for redundancy
const RSSHUB_INSTANCES = [
  "https://rsshub.app",
  "https://rsshub.rssforever.com",
  "https://rss.shab.fun",
]

// Nitter instances (privacy-friendly Twitter frontends)
const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://xcancel.com",
  "https://nitter.net",
]

// Simple in-memory cache to avoid hitting rate limits
const twitterCache = new Map<string, { data: NewsItem[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Token rotation state
const bearerTokens: string[] = []
let currentTokenIndex = 0

/**
 * Initialize bearer tokens from environment variables
 * Supports: TWITTER_BEARER_TOKEN, TWITTER_BEARER_TOKEN_1, TWITTER_BEARER_TOKEN_2, etc.
 */
function initializeBearerTokens(): void {
  if (bearerTokens.length > 0) return // Already initialized

  // Check for single token
  if (process.env.TWITTER_BEARER_TOKEN) {
    bearerTokens.push(process.env.TWITTER_BEARER_TOKEN)
  }

  // Check for numbered tokens (1-indexed)
  let i = 1
  while (process.env[`TWITTER_BEARER_TOKEN_${i}`]) {
    bearerTokens.push(process.env[`TWITTER_BEARER_TOKEN_${i}`]!)
    i++
  }

  if (bearerTokens.length > 0) {
    console.info(`Initialized ${bearerTokens.length} Twitter bearer token(s) for rotation`)
  }
}

/**
 * Get next bearer token in rotation
 */
function getNextToken(): string | null {
  initializeBearerTokens()

  if (bearerTokens.length === 0) {
    return null
  }

  const token = bearerTokens[currentTokenIndex]
  currentTokenIndex = (currentTokenIndex + 1) % bearerTokens.length
  return token
}

/**
 * Check if Twitter API v2 Bearer Token is configured
 */
function hasTwitterBearerToken(): boolean {
  initializeBearerTokens()
  return bearerTokens.length > 0
}

/**
 * Check if RSSHub Twitter credentials are configured
 */
function hasRSSHubTwitterAuth(): boolean {
  return !!(
    process.env.TWITTER_AUTH_TOKEN
    || (process.env.TWITTER_USERNAME && process.env.TWITTER_PASSWORD)
  )
}

/**
 * Get cached data if available and not expired
 */
function getCached(key: string): NewsItem[] | null {
  const cached = twitterCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

/**
 * Store data in cache
 */
function setCache(key: string, data: NewsItem[]): void {
  twitterCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Fetch trending tweets using Twitter API v2 with token rotation and retry logic
 *
 * NOTE: Twitter API v2 search endpoints require Basic tier ($100/month) or higher.
 * Free tier tokens will receive 400 Bad Request errors and should use RSSHub/Nitter instead.
 */
async function fetchFromTwitterAPI(query: string, maxRetries?: number): Promise<NewsItem[]> {
  initializeBearerTokens()
  const retries = maxRetries ?? bearerTokens.length // Retry up to the number of tokens available
  const errors: string[] = []

  for (let attempt = 0; attempt < Math.max(1, retries); attempt++) {
    const bearerToken = getNextToken()

    if (!bearerToken) {
      throw new Error("No Twitter bearer tokens available")
    }

    try {
      const url = new URL("https://api.twitter.com/2/tweets/search/recent")
      url.searchParams.append("query", query)
      url.searchParams.append("max_results", "10")
      url.searchParams.append("tweet.fields", "created_at,author_id")
      url.searchParams.append("expansions", "author_id")
      url.searchParams.append("user.fields", "username,name")

      const response: TwitterV2Response = await myFetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${bearerToken}`,
          "User-Agent": "NewsNow-Bot/1.0",
        },
      })

      if (!response.data || response.data.length === 0) {
        throw new Error("No tweets found")
      }

      // Create a map of users for quick lookup
      const usersMap = new Map(
        response.includes?.users?.map(user => [user.id, user]) || [],
      )

      // Success! Return the results
      return response.data.map((tweet) => {
        const author = tweet.author_id ? usersMap.get(tweet.author_id) : undefined
        const username = author?.username || "unknown"
        const displayName = author?.name || username

        return {
          id: tweet.id,
          title: tweet.text.length > 100 ? `${tweet.text.substring(0, 100)}...` : tweet.text,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          pubDate: tweet.created_at ? new Date(tweet.created_at).getTime() : Date.now(),
          extra: {
            info: displayName,
            hover: tweet.text,
          },
        }
      })
    } catch (error) {
      const errorMsg = (error as Error).message
      const tokenNum = ((currentTokenIndex - 1 + bearerTokens.length) % bearerTokens.length) + 1

      // Any error: try next token
      errors.push(`Token ${tokenNum}: ${errorMsg}`)
      console.warn(`Token ${tokenNum} failed: ${errorMsg}. Retrying with next token... (attempt ${attempt + 1}/${retries})`)
      continue // Try next token
    }
  }

  // All retries exhausted
  throw new Error(`Twitter API v2 failed after ${retries} attempts. Errors: ${errors.join("; ")}`)
}

/**
 * Fetch Twitter content from RSSHub
 */
async function fetchFromRSSHub(route: string): Promise<NewsItem[]> {
  const errors: Error[] = []

  for (const baseUrl of RSSHUB_INSTANCES) {
    try {
      const rssUrl = `${baseUrl}${route}`
      const data = await rss2json(rssUrl)

      if (!data?.items || data.items.length === 0) {
        continue
      }

      return data.items.slice(0, 10).map((item, index) => ({
        id: item.link || item.id || `twitter-${index}-${Date.now()}`,
        title: item.title || "Untitled",
        url: item.link || "https://twitter.com",
        pubDate: item.created,
        extra: {
          info: item.author || undefined,
          hover: item.description || item.content || undefined,
        },
      }))
    } catch (error) {
      errors.push(error as Error)
      console.warn(`RSSHub fetch failed from ${baseUrl}${route}:`, (error as Error).message)
      continue
    }
  }

  throw new Error(`All RSSHub instances failed for ${route}`)
}

/**
 * Fetch trending content from Nitter instances
 */
async function fetchFromNitter(): Promise<NewsItem[]> {
  const errors: Error[] = []

  for (const baseUrl of NITTER_INSTANCES) {
    try {
      const html: any = await myFetch(`${baseUrl}/search?f=tweets&q=%23trending`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      })

      const $ = cheerio.load(html)
      const news: NewsItem[] = []

      $(".timeline-item").each((index, element) => {
        if (index >= 10) return false

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
          news.push({
            id: tweetPath,
            title: text.length > 100 ? `${text.substring(0, 100)}...` : text,
            url: `https://twitter.com${tweetPath}`,
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
      errors.push(error as Error)
      console.warn(`Nitter fetch failed from ${baseUrl}:`, (error as Error).message)
      continue
    }
  }

  throw new Error("All Nitter instances failed")
}

/**
 * Trending topics
 */
const trending = defineSource(async () => {
  const cacheKey = "twitter-trending"

  // Check cache first
  const cached = getCached(cacheKey)
  if (cached) {
    return cached
  }

  // Strategy 1: Try Twitter API v2 with Bearer Token (best quality, most reliable)
  if (hasTwitterBearerToken()) {
    // Use single query to avoid rate limits
    try {
      const results = await fetchFromTwitterAPI("lang:en -is:retweet")
      if (results.length > 0) {
        setCache(cacheKey, results)
        return results
      }
    } catch (error) {
      const errorMsg = (error as Error).message
      if (errorMsg.includes("429")) {
        console.warn(`Twitter API rate limit exceeded. Using cache or fallback... ${errorMsg}`)
      } else {
        console.warn("Twitter API v2 failed:", errorMsg)
      }
    }
  }

  // Strategy 2: Try RSSHub with Twitter credentials
  if (hasRSSHubTwitterAuth()) {
    try {
      const results = await fetchFromRSSHub("/twitter/trends/1")
      setCache(cacheKey, results)
      return results
    } catch (error) {
      console.warn("RSSHub trends failed:", (error as Error).message)
    }
  }

  // Strategy 3: Fallback to Nitter instances
  console.info("Twitter API/RSSHub not configured or rate limited. Trying Nitter instances...")

  try {
    const results = await fetchFromNitter()
    setCache(cacheKey, results)
    return results
  } catch (error) {
    throw new Error(`Unable to fetch Twitter trends. All methods failed. Last error: ${(error as Error).message}`)
  }
})

/**
 * Explore/discover popular tweets
 */
// const explore = defineSource(async () => {
//   const cacheKey = "twitter-explore"

//   // Check cache first
//   const cached = getCached(cacheKey)
//   if (cached) {
//     return cached
//   }

//   // Strategy 1: Try Twitter API v2 (single query to avoid rate limits)
//   if (hasTwitterBearerToken()) {
//     try {
//       const results = await fetchFromTwitterAPI("technology OR science lang:en -is:retweet")
//       if (results.length > 0) {
//         setCache(cacheKey, results)
//         return results
//       }
//     } catch (error) {
//       const errorMsg = (error as Error).message
//       if (errorMsg.includes("429")) {
//         console.warn("Twitter API rate limit exceeded for explore. Using cache or fallback...")
//       } else {
//         console.warn("Twitter API v2 explore failed:", errorMsg)
//       }
//     }
//   }

//   // Strategy 2: Try RSSHub
//   if (hasRSSHubTwitterAuth()) {
//     try {
//       const results = await fetchFromRSSHub("/twitter/keyword/technology")
//       setCache(cacheKey, results)
//       return results
//     } catch (error) {
//       console.warn("RSSHub keyword failed:", (error as Error).message)
//     }
//   }

//   // Strategy 3: Fallback to Nitter
//   try {
//     const results = await fetchFromNitter()
//     setCache(cacheKey, results)
//     return results
//   } catch (error) {
//     throw new Error(`Unable to fetch Twitter explore content: ${(error as Error).message}`)
//   }
// })

export default defineSource({
  "twitter": trending,
  "twitter-trending": trending,
  // "twitter-explore": explore, // Disabled to reduce API usage
})
