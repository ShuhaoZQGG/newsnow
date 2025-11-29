import type { Region } from "@newsnow/shared/types";
import { atom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create the base atom with initial value
const baseRegionAtom = atom<Region>("global");

/**
 * Atom for storing the currently selected region
 * Persists to AsyncStorage with default value of "global"
 */
export const regionAtom = atom(
  (get) => get(baseRegionAtom),
  async (get, set, newValue: Region) => {
    set(baseRegionAtom, newValue);
    try {
      await AsyncStorage.setItem("region", JSON.stringify(newValue));
    } catch (e) {
      console.error("Failed to save region", e);
    }
  },
);

// Load from storage on mount
regionAtom.onMount = (setAtom) => {
  AsyncStorage.getItem("region")
    .then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAtom(parsed);
        } catch (e) {
          console.warn("Failed to load region", e);
        }
      }
    })
    .catch((e) => {
      console.error("Failed to read region", e);
    });
};
