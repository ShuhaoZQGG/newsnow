import { atom } from "jotai";

export interface TranslationProgress {
  sourceId: string;
  sourceName: string;
  total: number;
  completed: number;
  startTime: number;
}

export const translationProgressAtom = atom<TranslationProgress | null>(null);
