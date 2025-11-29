import type { HiddenColumnID } from "@newsnow/shared/types";
import { atom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create the base atom with initial value
const baseTopicAtom = atom<HiddenColumnID | null>(null);

/**
 * Atom for storing the currently selected topic/column filter
 * Persists to AsyncStorage with default value of null (all topics)
 */
export const topicAtom = atom(
  (get) => get(baseTopicAtom),
  async (get, set, newValue: HiddenColumnID | null) => {
    set(baseTopicAtom, newValue);
    try {
      await AsyncStorage.setItem("topic", JSON.stringify(newValue));
    } catch (e) {
      console.error("Failed to save topic", e);
    }
  },
);

// Load from storage on mount
topicAtom.onMount = (setAtom) => {
  AsyncStorage.getItem("topic")
    .then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAtom(parsed);
        } catch (e) {
          console.warn("Failed to load topic", e);
        }
      }
    })
    .catch((e) => {
      console.error("Failed to read topic", e);
    });
};
