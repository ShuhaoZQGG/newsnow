import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { SupportedLanguage } from "~/utils/translate"

/**
 * Language preference atom
 * Stores user's selected language in localStorage
 */
export const languageAtom = atomWithStorage<SupportedLanguage>("language", "en")

/**
 * Translation enabled atom
 * Controls whether news content should be translated
 */
export const translationEnabledAtom = atomWithStorage<boolean>("translationEnabled", true)

/**
 * Translation mode atom
 * Controls whether to translate lazily (on-demand) or eagerly (all at once)
 * - 'lazy': Translate only when viewing (default)
 * - 'eager': Pre-translate all items when loaded
 */
export const translationModeAtom = atomWithStorage<"lazy" | "eager">("translationMode", "lazy")

/**
 * Derived atom to get current language with sync to i18next
 */
export const currentLanguageAtom = atom(
  get => get(languageAtom),
  (get, set, newLanguage: SupportedLanguage) => {
    set(languageAtom, newLanguage)
    // Sync with i18next
    import("~/i18n").then((i18n) => {
      i18n.default.changeLanguage(newLanguage)
    })
  },
)
