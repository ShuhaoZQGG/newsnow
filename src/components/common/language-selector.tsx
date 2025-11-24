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

  const currentLang = i18n.language as SupportedLanguage
  const languages = Object.entries(SUPPORTED_LANGUAGES)

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang)
  }

  return (
    <li className="relative group">
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="i-ph:translate-duotone inline-block" />
        <span>{SUPPORTED_LANGUAGES[currentLang]?.nativeName || "Language"}</span>
        <span className="i-ph:caret-down inline-block text-xs" />
      </div>

      {/* Language dropdown */}
      <div className="absolute hidden group-hover:block left-0 top-full mt-1 w-150px bg-base bg-op-90! backdrop-blur-md rounded-lg shadow-lg z-100">
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
    </li>
  )
}
