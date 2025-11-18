/**
 * YouTube source implementation
 *
 * Uses RSSHub as primary method for trending videos
 * Falls back gracefully if RSSHub is unavailable
 */

const trending = defineSource(async () => {
  // Try multiple RSSHub instances for reliability
  const rssHubInstances = [
    "https://rsshub.app",
    "https://rsshub.rssforever.com",
  ]

  let lastError: Error | null = null

  for (const rssHubBase of rssHubInstances) {
    try {
      const rssUrl = `${rssHubBase}/youtube/trending`
      const data = await rss2json(rssUrl)

      if (!data?.items || data.items.length === 0) {
        throw new Error("No items returned from RSSHub")
      }

      return data.items.slice(0, 30).map((item, index) => ({
        id: item.link || `youtube-${index}`,
        title: item.title || "Untitled",
        url: item.link || "https://youtube.com",
        pubDate: item.created,
        extra: {
          info: item.author || undefined,
          hover: item.description ? item.description.replace(/<[^>]*>/g, "").slice(0, 200) : undefined,
        },
      }))
    } catch (error) {
      lastError = error as Error
      console.warn(`Failed to fetch from ${rssHubBase}:`, error)
      continue
    }
  }

  // If all instances failed
  throw new Error(`Unable to fetch YouTube trending. All RSSHub instances failed. Last error: ${lastError?.message || "Unknown"}`)
})

// Popular channels or categories
const gaming = defineSource(async () => {
  const rssHubInstances = [
    "https://rsshub.app",
    "https://rsshub.rssforever.com",
  ]

  for (const rssHubBase of rssHubInstances) {
    try {
      const rssUrl = `${rssHubBase}/youtube/trending/gaming`
      const data = await rss2json(rssUrl)

      if (!data?.items || data.items.length === 0) {
        throw new Error("No gaming items returned")
      }

      return data.items.slice(0, 30).map((item, index) => ({
        id: item.link || `youtube-gaming-${index}`,
        title: item.title || "Untitled",
        url: item.link || "https://youtube.com",
        pubDate: item.created,
        extra: {
          info: item.author || undefined,
        },
      }))
    } catch (error) {
      console.warn(`YouTube gaming failed from ${rssHubBase}:`, error)
      continue
    }
  }

  // Fallback to main trending if all gaming attempts fail
  console.warn("All YouTube gaming sources failed, falling back to trending")
  return trending()
})

const music = defineSource(async () => {
  const rssHubInstances = [
    "https://rsshub.app",
    "https://rsshub.rssforever.com",
  ]

  for (const rssHubBase of rssHubInstances) {
    try {
      const rssUrl = `${rssHubBase}/youtube/trending/music`
      const data = await rss2json(rssUrl)

      if (!data?.items || data.items.length === 0) {
        throw new Error("No music items returned")
      }

      return data.items.slice(0, 30).map((item, index) => ({
        id: item.link || `youtube-music-${index}`,
        title: item.title || "Untitled",
        url: item.link || "https://youtube.com",
        pubDate: item.created,
        extra: {
          info: item.author || undefined,
        },
      }))
    } catch (error) {
      console.warn(`YouTube music failed from ${rssHubBase}:`, error)
      continue
    }
  }

  // Fallback to main trending if all music attempts fail
  console.warn("All YouTube music sources failed, falling back to trending")
  return trending()
})

export default defineSource({
  "youtube": trending,
  "youtube-trending": trending,
  "youtube-gaming": gaming,
  "youtube-music": music,
})
