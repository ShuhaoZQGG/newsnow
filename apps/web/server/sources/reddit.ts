interface RedditPost {
  data: {
    id: string
    title: string
    permalink: string
    url: string
    author: string
    created_utc: number
    score: number
    num_comments: number
    subreddit: string
    thumbnail?: string
    preview?: {
      images?: Array<{
        source?: {
          url?: string
        }
      }>
    }
    selftext?: string
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
    after?: string
  }
}

const popular = defineSource(async () => {
  const url = "https://www.reddit.com/r/popular.json?limit=30"
  const res: RedditResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  })

  return res.data.children.map((post) => {
    const { data } = post
    const thumbnail = data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&")

    return {
      id: data.id,
      title: data.title,
      url: `https://www.reddit.com${data.permalink}`,
      pubDate: data.created_utc * 1000,
      extra: {
        info: `r/${data.subreddit} · ↑${formatScore(data.score)} · ${data.num_comments} comments`,
        hover: data.selftext ? data.selftext.slice(0, 200) : undefined,
        icon: thumbnail && thumbnail.startsWith("http") ? proxyPicture(thumbnail) : undefined,
      },
    }
  })
})

const all = defineSource(async () => {
  const url = "https://www.reddit.com/r/all.json?limit=30"
  const res: RedditResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  })

  return res.data.children.map((post) => {
    const { data } = post
    const thumbnail = data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&")

    return {
      id: data.id,
      title: data.title,
      url: `https://www.reddit.com${data.permalink}`,
      pubDate: data.created_utc * 1000,
      extra: {
        info: `r/${data.subreddit} · ↑${formatScore(data.score)} · ${data.num_comments} comments`,
        hover: data.selftext ? data.selftext.slice(0, 200) : undefined,
        icon: thumbnail && thumbnail.startsWith("http") ? proxyPicture(thumbnail) : undefined,
      },
    }
  })
})

const programming = defineSource(async () => {
  const url = "https://www.reddit.com/r/programming.json?limit=30"
  const res: RedditResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  })

  return res.data.children.map((post) => {
    const { data } = post
    const thumbnail = data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&")

    return {
      id: data.id,
      title: data.title,
      url: `https://www.reddit.com${data.permalink}`,
      pubDate: data.created_utc * 1000,
      extra: {
        info: `↑${formatScore(data.score)} · ${data.num_comments} comments`,
        hover: data.selftext ? data.selftext.slice(0, 200) : undefined,
        icon: thumbnail && thumbnail.startsWith("http") ? proxyPicture(thumbnail) : undefined,
      },
    }
  })
})

const worldnews = defineSource(async () => {
  const url = "https://www.reddit.com/r/worldnews.json?limit=30"
  const res: RedditResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  })

  return res.data.children.map((post) => {
    const { data } = post
    const thumbnail = data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&")

    return {
      id: data.id,
      title: data.title,
      url: `https://www.reddit.com${data.permalink}`,
      pubDate: data.created_utc * 1000,
      extra: {
        info: `↑${formatScore(data.score)} · ${data.num_comments} comments`,
        hover: data.selftext ? data.selftext.slice(0, 200) : undefined,
        icon: thumbnail && thumbnail.startsWith("http") ? proxyPicture(thumbnail) : undefined,
      },
    }
  })
})

function formatScore(score: number): string {
  if (score >= 10000) {
    return `${(score / 1000).toFixed(1)}k`
  }
  return score.toString()
}

export default defineSource({
  "reddit": popular,
  "reddit-popular": popular,
  "reddit-all": all,
  "reddit-programming": programming,
  "reddit-worldnews": worldnews,
})
