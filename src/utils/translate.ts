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
    return text // Return original text on error
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
