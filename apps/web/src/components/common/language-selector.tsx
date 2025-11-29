import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import { currentLanguageAtom } from "~/atoms/languageAtom"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~/utils/translate"

/**
 * Language selector component
 * Displays a dropdown of supported languages
 */
export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [, setLanguage] = useAtom(currentLanguageAtom)
  const [isHovered, setIsHovered] = useState(false)

  const currentLang = i18n.language as SupportedLanguage
  const languages = Object.entries(SUPPORTED_LANGUAGES)

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang)
  }

  return (
    <li
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="i-ph:translate-duotone inline-block" />
        <span>{SUPPORTED_LANGUAGES[currentLang]?.nativeName || "Language"}</span>
        <span className="i-ph:caret-down inline-block text-xs" />
      </div>

      {/* Language dropdown */}
      {isHovered && (
        <div className="absolute left-0 top-full pt-1 w-150px z-100">
          <div className="bg-base bg-op-90! backdrop-blur-md rounded-lg shadow-lg">
            <ul className="py-1">
              {languages.map(([code, lang]) => (
                <li
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={$([
                    "px-4 py-2 cursor-pointer hover:bg-primary hover:bg-op-20 transition-all",
                    currentLang === code && "bg-primary bg-op-10 font-semibold",
                  ])}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.nativeName}</span>
                    {currentLang === code && (
                      <span className="i-ph:check inline-block text-sm" />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}
