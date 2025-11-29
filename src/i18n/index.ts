import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "./locales/en.json"
import zh from "./locales/zh.json"
import fr from "./locales/fr.json"
import es from "./locales/es.json"
import de from "./locales/de.json"

export const resources = {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
} as const

// Initialize i18next
i18n
  .use(LanguageDetector) // Automatically detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: "en", // Default language
    defaultNS: "translation",

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ["localStorage", "navigator", "htmlTag"],
      // Cache user language preference
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Support plurals
    pluralSeparator: "_",

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
  })

export default i18n
