import { useEffect, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import type { SourceID } from "@shared/types"
import { sources } from "@shared/sources"
import { currentLanguageAtom, translationModeAtom } from "~/atoms/languageAtom"
import { batchTranslate, detectLanguage } from "~/utils/translate"
import { translationProgressAtom } from "~/atoms/translationProgressAtom"

/**
 * Hook for eager translation - pre-translates all items at once
 * Returns a map of original text to translated text
 */
export function useEagerTranslation(items: Array<{ title: string }>, sourceId?: SourceID) {
  const targetLang = useAtomValue(currentLanguageAtom)
  const mode = useAtomValue(translationModeAtom)
  const setProgress = useSetAtom(translationProgressAtom)
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    // Only run in eager mode
    if (mode !== "eager" || !items || items.length === 0) {
      setTranslations(new Map())
      return
    }

    // Skip translation if source has disableTranslation flag
    if (sourceId && sources[sourceId]?.disableTranslation) {
      setTranslations(new Map())
      return
    }

    const translateAll = async () => {
      setIsTranslating(true)
      const startTime = Date.now()

      try {
        // Extract all unique titles that need translation
        const titlesToTranslate = items
          .map(item => item.title)
          .filter((title) => {
            const sourceLang = detectLanguage(title)
            return sourceLang !== targetLang && title && title.trim() !== ""
          })

        if (titlesToTranslate.length === 0) {
          setTranslations(new Map())
          setIsTranslating(false)
          return
        }

        // Report progress start (only in dev mode)
        if (import.meta.env.DEV && sourceId) {
          setProgress({
            sourceId,
            sourceName: sources[sourceId]?.name || sourceId,
            total: titlesToTranslate.length,
            completed: 0,
            startTime,
          })
        }

        // Batch translate all titles
        const translatedTexts = await batchTranslate(titlesToTranslate, targetLang)

        // Create map of original -> translated
        const newTranslations = new Map<string, string>()
        titlesToTranslate.forEach((original, index) => {
          newTranslations.set(original, translatedTexts[index])
        })

        setTranslations(newTranslations)

        // Report progress complete (only in dev mode)
        if (import.meta.env.DEV && sourceId) {
          setProgress({
            sourceId,
            sourceName: sources[sourceId]?.name || sourceId,
            total: titlesToTranslate.length,
            completed: titlesToTranslate.length,
            startTime,
          })

          // Clear progress after 2 seconds
          setTimeout(() => setProgress(null), 2000)
        }
      } catch (error) {
        console.error("Eager translation error:", error)
        setTranslations(new Map())
        // Clear progress on error
        if (import.meta.env.DEV) {
          setProgress(null)
        }
      } finally {
        setIsTranslating(false)
      }
    }

    translateAll()
  }, [items, targetLang, mode, sourceId, setProgress])

  return { translations, isTranslating }
}
