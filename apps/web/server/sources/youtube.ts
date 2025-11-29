/**
 * YouTube source implementation
 *
 * Uses YouTube Data API v3 for trending videos
 * Free tier: 10,000 units/day, videos.list costs only 1 unit per request
 * Set YOUTUBE_API_KEY environment variable to enable
 *
 * If no API key is set, the source will be disabled with a helpful error message
 */

import process from "node:process"

interface YouTubeVideo {
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    channelTitle: string
  }
}

interface YouTubeAPIResponse {
  items: YouTubeVideo[]
}

// Map category names to YouTube video category IDs
const CATEGORY_IDS: Record<string, string> = {
  gaming: "20",
  music: "10",
  movies: "30",
}

async function fetchFromYouTubeAPI(categoryId?: string, region: string = "US"): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error(
      "YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable. "
      + "Get a free API key from https://console.cloud.google.com/apis/credentials (10,000 units/day free tier)",
    )
  }

  try {
    const url = "https://www.googleapis.com/youtube/v3/videos"
    const params = new URLSearchParams({
      part: "snippet",
      chart: "mostPopular",
      regionCode: region,
      maxResults: "50",
      key: apiKey,
    })

    if (categoryId) {
      params.append("videoCategoryId", categoryId)
    }

    const response = await $fetch<YouTubeAPIResponse>(`${url}?${params.toString()}`, {
      timeout: 10000,
    })

    if (!response?.items || response.items.length === 0) {
      throw new Error("No videos returned from YouTube API")
    }

    return response.items.slice(0, 30).map(video => ({
      id: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      pubDate: video.snippet.publishedAt,
      extra: {
        info: video.snippet.channelTitle,
        hover: video.snippet.description ? video.snippet.description.slice(0, 200) : undefined,
      },
    }))
  } catch (error: any) {
    if (error?.statusCode === 403) {
      throw new Error(
        "YouTube API quota exceeded or invalid API key. "
        + "Check your API key and quota at https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas",
      )
    }
    throw error
  }
}

const trending = defineSource(async () => {
  return fetchFromYouTubeAPI()
})

// Gaming category trending videos
const gaming = defineSource(async () => {
  try {
    return await fetchFromYouTubeAPI(CATEGORY_IDS.gaming)
  } catch (error) {
    console.warn("YouTube gaming failed, falling back to trending:", error)
    return trending()
  }
})

// Music category trending videos
const music = defineSource(async () => {
  try {
    return await fetchFromYouTubeAPI(CATEGORY_IDS.music)
  } catch (error) {
    console.warn("YouTube music failed, falling back to trending:", error)
    return trending()
  }
})

export default defineSource({
  "youtube": trending,
  "youtube-trending": trending,
  "youtube-gaming": gaming,
  "youtube-music": music,
})
