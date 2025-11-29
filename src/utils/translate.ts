/**
 * Translation service for news content using LibreTranslate
 * Supports on-demand translation with in-memory caching
 */

export interface TranslationOptions {
  text: string
  targetLang: string
  sourceLang?: string
}

export interface TranslationCache {
  [key: string]: string
}

// In-memory translation cache
const translationCache: TranslationCache = {}

// LibreTranslate API configuration
// Users can set their own instance via environment variable or use public instance
const LIBRETRANSLATE_API = import.meta.env.VITE_LIBRETRANSLATE_API || "https://libretranslate.com"
const LIBRETRANSLATE_KEY = import.meta.env.VITE_LIBRETRANSLATE_KEY || ""

// API availability check cache
interface ApiHealthCheck {
  isAvailable: boolean
  lastChecked: number
}

let apiHealthCheck: ApiHealthCheck | null = null
const HEALTH_CHECK_TTL = 5 * 60 * 1000 // 5 minutes
const HEALTH_CHECK_TIMEOUT = 3000 // 3 seconds timeout for health check

/**
 * Supported languages with their ISO 639-1 codes
 */
export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", nativeName: "English" },
  zh: { code: "zh", name: "Chinese", nativeName: "中文" },
  fr: { code: "fr", name: "French", nativeName: "Français" },
  es: { code: "es", name: "Spanish", nativeName: "Español" },
  de: { code: "de", name: "German", nativeName: "Deutsch" },
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

/**
 * Generate cache key for translation
 */
function getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
  return `${sourceLang || "auto"}_${targetLang}_${text}`
}

/**
 * Check if the LibreTranslate API is available
 * Uses a cached result to avoid repeated checks
 */
async function checkApiAvailability(): Promise<boolean> {
  const now = Date.now()

  // Return cached result if still valid
  if (apiHealthCheck && (now - apiHealthCheck.lastChecked) < HEALTH_CHECK_TTL) {
    return apiHealthCheck.isAvailable
  }

  // Perform health check
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

    // Try to fetch the languages endpoint as a health check
    // This is a lightweight endpoint that doesn't require authentication
    const response = await fetch(`${LIBRETRANSLATE_API}/languages`, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const isAvailable = response.ok

    // Cache the result
    apiHealthCheck = {
      isAvailable,
      lastChecked: now,
    }

    return isAvailable
  } catch {
    // API is not available
    apiHealthCheck = {
      isAvailable: false,
      lastChecked: now,
    }
    return false
  }
}

/**
 * Detect language of text (simple heuristic)
 * Returns 'zh' for Chinese, 'en' for likely English, 'auto' for unknown
 */
export function detectLanguage(text: string): string {
  // Check for Chinese characters
  if (/[\u4E00-\u9FA5]/.test(text)) {
    return "zh"
  }
  // Check for common English patterns
  if (/^[a-z0-9\s.,!?'"()-]+$/i.test(text)) {
    return "en"
  }
  // Check for French accents
  if (/[àâäæçéèêëïîôùûüÿœ]/i.test(text)) {
    return "fr"
  }
  // Check for Spanish accents
  if (/[áéíóúñü¿¡]/i.test(text)) {
    return "es"
  }
  // Check for German umlauts
  if (/[äöüß]/i.test(text)) {
    return "de"
  }
  return "auto"
}

/**
 * Translate text using LibreTranslate API
 */
export async function translateText(options: TranslationOptions): Promise<string> {
  const { text, targetLang, sourceLang } = options

  // Return original if no text
  if (!text || text.trim() === "") {
    return text
  }

  // Detect source language if not provided
  const detectedSourceLang = sourceLang || detectLanguage(text)

  // Skip translation if source and target are the same
  if (detectedSourceLang === targetLang) {
    return text
  }

  // Check cache first
  const cacheKey = getCacheKey(text, targetLang, detectedSourceLang)
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey]
  }

  // Pre-check: Verify API is available before making request
  const isApiAvailable = await checkApiAvailability()
  if (!isApiAvailable) {
    // API is not available, return original text without making request
    return text
  }

  try {
    const params = new URLSearchParams({
      q: text,
      source: detectedSourceLang,
      target: targetLang,
      format: "text",
    })

    if (LIBRETRANSLATE_KEY) {
      params.append("api_key", LIBRETRANSLATE_KEY)
    }

    const response = await fetch(`${LIBRETRANSLATE_API}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    if (!response.ok) {
      return text // Return original text on error
    }

    const data = await response.json()
    const translatedText = data.translatedText || text

    // Cache the translation
    translationCache[cacheKey] = translatedText

    return translatedText
  } catch {
    // Silently handle errors - return original text
    // Network errors are logged by the browser console automatically,
    // but we don't want to propagate them further
    return text
  }
}

/**
 * Batch translate multiple texts
 * Useful for translating all items in a news list
 */
export async function batchTranslate(
  texts: string[],
  targetLang: string,
  sourceLang?: string,
): Promise<string[]> {
  // Translate in parallel with Promise.all
  return Promise.all(
    texts.map(text => translateText({ text, targetLang, sourceLang })),
  )
}

/**
 * Clear translation cache
 * Useful for memory management or when switching language settings
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach((key) => {
    delete translationCache[key]
  })
}

/**
 * Get cache size for debugging/monitoring
 */
export function getTranslationCacheSize(): number {
  return Object.keys(translationCache).length
}

/**
 * Force a new API availability check
 * Useful when you know the API status has changed
 */
export function resetApiHealthCheck(): void {
  apiHealthCheck = null
}
