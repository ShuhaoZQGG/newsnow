import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedLanguage } from "../utils/translate";

// Create custom storage that works synchronously with a cache
function createAsyncStorageAtom<T>(key: string, initialValue: T) {
  const baseAtom = atom<T>(initialValue);

  const derivedAtom = atom(
    (get) => get(baseAtom),
    async (get, set, newValue: T) => {
      set(baseAtom, newValue);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        console.error(`Failed to save ${key}`, e);
      }
    },
  );

  // Load from storage on mount
  derivedAtom.onMount = (setAtom) => {
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setAtom(parsed);
          } catch (e) {
            console.warn(`Failed to load ${key}`, e);
          }
        }
      })
      .catch((e) => {
        console.error(`Failed to read ${key}`, e);
      });
  };

  return derivedAtom;
}

/**
 * Language preference atom
 * Stores user's selected language in AsyncStorage
 */
export const languageAtom = createAsyncStorageAtom<SupportedLanguage>(
  "language",
  "en",
);

/**
 * Translation enabled atom
 * Controls whether news content should be translated
 */
export const translationEnabledAtom = createAsyncStorageAtom<boolean>(
  "translationEnabled",
  true,
);

/**
 * Translation mode atom
 * Controls whether to translate lazily (on-demand) or eagerly (all at once)
 * - 'lazy': Translate only when viewing (default)
 * - 'eager': Pre-translate all items when loaded
 */
export const translationModeAtom = createAsyncStorageAtom<"lazy" | "eager">(
  "translationMode",
  "lazy",
);

/**
 * Derived atom to get current language with sync to i18next
 */
export const currentLanguageAtom = atom(
  (get) => get(languageAtom),
  (get, set, newLanguage: SupportedLanguage) => {
    set(languageAtom, newLanguage);
    // Sync with i18next
    import("../i18n").then((i18n) => {
      i18n.default.changeLanguage(newLanguage);
    });
  },
);
