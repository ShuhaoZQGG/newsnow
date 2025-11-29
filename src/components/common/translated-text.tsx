import { useAtomValue } from "jotai"
import type { SourceID } from "@shared/types"
import { useTranslateContent } from "~/hooks/useTranslateContent"
import { translationModeAtom } from "~/atoms/languageAtom"

interface TranslatedTextProps {
  text: string
  className?: string
  preTranslated?: string // For eager mode - pass pre-translated text
  sourceId?: SourceID // Optional source ID to check disableTranslation flag
}

/**
 * Component that automatically translates text based on user's language preference
 * Shows the translated text with a loading indicator when translating
 * Supports both lazy (on-demand) and eager (pre-translated) modes
 */
export function TranslatedText({ text, className, preTranslated, sourceId }: TranslatedTextProps) {
  const mode = useAtomValue(translationModeAtom)
  const { translatedText, isTranslating } = useTranslateContent(text, sourceId)

  // In eager mode, use pre-translated text if available
  const displayText = mode === "eager" && preTranslated ? preTranslated : translatedText

  return (
    <span className={className}>
      {isTranslating && mode === "lazy"
        ? (
            <span className="animate-pulse">{text}</span>
          )
        : (
            displayText
          )}
    </span>
  )
}
