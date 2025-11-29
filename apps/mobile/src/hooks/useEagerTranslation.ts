import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import type { SourceID } from "@newsnow/shared/types";
import { sources } from "@newsnow/shared/sources";
import {
  currentLanguageAtom,
  translationModeAtom,
} from "../atoms/languageAtom";
import { batchTranslate, detectLanguage } from "../utils/translate";
import { translationProgressAtom } from "../atoms/translationProgressAtom";

/**
 * Hook for eager translation - pre-translates all items at once
 * Returns a map of original text to translated text
 */
export function useEagerTranslation(
  items: Array<{ title: string }>,
  sourceId?: SourceID,
) {
  const targetLang = useAtomValue(currentLanguageAtom);
  const mode = useAtomValue(translationModeAtom);
  const setProgress = useSetAtom(translationProgressAtom);
  const [translations, setTranslations] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [isTranslating, setIsTranslating] = useState(false);

  // Use refs to track previous values to avoid unnecessary updates
  const prevItemsRef = useRef<Array<{ title: string }>>([]);
  const prevTargetLangRef = useRef(targetLang);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    // Check if relevant dependencies actually changed
    const itemsChanged = items !== prevItemsRef.current;
    const targetLangChanged = targetLang !== prevTargetLangRef.current;
    const modeChanged = mode !== prevModeRef.current;

    // Only run in eager mode
    if (mode !== "eager" || !items || items.length === 0) {
      // Only clear if we have translations and mode changed or items are empty
      if (
        (modeChanged && mode !== "eager") ||
        (items && items.length === 0 && translations.size > 0)
      ) {
        setTranslations(new Map());
      }
      prevItemsRef.current = items;
      prevTargetLangRef.current = targetLang;
      prevModeRef.current = mode;
      return;
    }

    // Skip translation if source has disableTranslation flag
    if (sourceId && sources[sourceId]?.disableTranslation) {
      if (translations.size > 0) {
        setTranslations(new Map());
      }
      prevItemsRef.current = items;
      prevTargetLangRef.current = targetLang;
      prevModeRef.current = mode;
      return;
    }

    // Only proceed if something actually changed
    if (!itemsChanged && !targetLangChanged && !modeChanged) {
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);
      const startTime = Date.now();

      try {
        // Extract all unique titles that need translation
        const titlesToTranslate = items
          .map((item) => item.title)
          .filter((title) => {
            const sourceLang = detectLanguage(title);
            return sourceLang !== targetLang && title && title.trim() !== "";
          });

        if (titlesToTranslate.length === 0) {
          if (translations.size > 0) {
            setTranslations(new Map());
          }
          setIsTranslating(false);
          return;
        }

        // Report progress start (in development)
        if (__DEV__ && sourceId) {
          setProgress({
            sourceId,
            sourceName: sources[sourceId]?.name || sourceId,
            total: titlesToTranslate.length,
            completed: 0,
            startTime,
          });
        }

        // Batch translate all titles
        const translatedTexts = await batchTranslate(
          titlesToTranslate,
          targetLang,
        );

        // Create map of original -> translated
        const newTranslations = new Map<string, string>();
        titlesToTranslate.forEach((original, index) => {
          newTranslations.set(original, translatedTexts[index]);
        });

        setTranslations(newTranslations);

        // Report progress complete (in development)
        if (__DEV__ && sourceId) {
          setProgress({
            sourceId,
            sourceName: sources[sourceId]?.name || sourceId,
            total: titlesToTranslate.length,
            completed: titlesToTranslate.length,
            startTime,
          });

          // Clear progress after 2 seconds
          setTimeout(() => setProgress(null), 2000);
        }
      } catch (error) {
        console.error("Eager translation error:", error);
        setTranslations(new Map());
        // Clear progress on error
        if (__DEV__) {
          setProgress(null);
        }
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();

    // Update refs after processing
    prevItemsRef.current = items;
    prevTargetLangRef.current = targetLang;
    prevModeRef.current = mode;
  }, [items, targetLang, mode, sourceId, setProgress, translations.size]);

  return { translations, isTranslating };
}
