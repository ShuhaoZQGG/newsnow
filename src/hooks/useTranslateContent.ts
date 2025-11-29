import { useEffect, useState } from "react"
import { useAtomValue } from "jotai"
import type { SourceID } from "@shared/types"
import { sources } from "@shared/sources"
import { currentLanguageAtom, translationEnabledAtom, translationModeAtom } from "~/atoms/languageAtom"
import { detectLanguage, translateText } from "~/utils/translate"

/**
 * Hook to translate content (news titles, descriptions, etc.) on-demand
 * Returns the translated text and loading state
 * Only works in 'lazy' mode - in 'eager' mode, translations are handled by useEagerTranslation
 */
export function useTranslateContent(originalText: string, sourceId?: SourceID) {
  const targetLang = useAtomValue(currentLanguageAtom)
  const translationEnabled = useAtomValue(translationEnabledAtom)
  const mode = useAtomValue(translationModeAtom)

  const [translatedText, setTranslatedText] = useState<string>(originalText)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  useEffect(() => {
    // Skip translation if disabled, showing original, or in eager mode
    if (!translationEnabled || showOriginal || mode === "eager") {
      setTranslatedText(originalText)
      return
    }

    // Skip translation if source has disableTranslation flag
    if (sourceId && sources[sourceId]?.disableTranslation) {
      setTranslatedText(originalText)
      return
    }

    // Skip translation if no text
    if (!originalText || originalText.trim() === "") {
      setTranslatedText(originalText)
      return
    }

    // Detect source language
    const sourceLang = detectLanguage(originalText)

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      setTranslatedText(originalText)
      return
    }

    // Translate the text
    const performTranslation = async () => {
      setIsTranslating(true)
      try {
        const translated = await translateText({
          text: originalText,
          targetLang,
          sourceLang,
        })
        setTranslatedText(translated)
      } catch (error) {
        console.error("Translation error:", error)
        setTranslatedText(originalText) // Fallback to original on error
      } finally {
        setIsTranslating(false)
      }
    }

    performTranslation()
  }, [originalText, targetLang, translationEnabled, showOriginal, mode, sourceId])

  const toggleOriginal = () => setShowOriginal(!showOriginal)

  return {
    translatedText,
    isTranslating,
    showOriginal,
    toggleOriginal,
    isTranslated: translatedText !== originalText,
  }
}
