import {
  typeSafeObjectEntries,
  typeSafeObjectFromEntries,
} from "@newsnow/shared/type.util";
import { fixedColumnIds, metadata } from "@newsnow/shared/metadata";
import { sources } from "@newsnow/shared/sources";
import { verifyPrimitiveMetadata } from "@newsnow/shared/verify";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  FixedColumnID,
  PrimitiveMetadata,
  SourceID,
} from "@newsnow/shared/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initialMetadata = typeSafeObjectFromEntries(
  typeSafeObjectEntries(metadata)
    .filter(([id]) => fixedColumnIds.includes(id as any))
    .map(([id, val]) => [id, val.sources] as [FixedColumnID, SourceID[]]),
);

const initialPrimitiveMetadata: PrimitiveMetadata = {
  updatedTime: 0,
  data: initialMetadata,
  action: "init",
};

export function preprocessMetadata(
  target: PrimitiveMetadata,
): PrimitiveMetadata {
  return {
    data: {
      ...initialMetadata,
      ...typeSafeObjectFromEntries(
        typeSafeObjectEntries(target.data)
          .filter(([id]) => initialMetadata[id])
          .map(([id, s]) => {
            if (id === "focus")
              return [
                id,
                s
                  .filter((k) => sources[k])
                  .map((k) => sources[k].redirect ?? k),
              ];
            const oldS = s
              .filter((k) => initialMetadata[id].includes(k))
              .map((k) => sources[k].redirect ?? k);
            const newS = initialMetadata[id].filter((k) => !oldS.includes(k));
            return [id, [...oldS, ...newS]];
          }),
      ),
    },
    action: target.action,
    updatedTime: target.updatedTime,
  };
}

// Create a base atom with initial value
const baseMetadataAtom = atom<PrimitiveMetadata>(initialPrimitiveMetadata);

// Create a derived atom that handles persistence
export const primitiveMetadataAtom = atom(
  (get) => get(baseMetadataAtom),
  async (get, set, update: PrimitiveMetadata) => {
    const nextValue = update;
    set(baseMetadataAtom, nextValue);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem("metadata", JSON.stringify(nextValue));
    } catch (e) {
      console.error("Failed to save metadata", e);
    }
  },
);

// Initialize from AsyncStorage on mount
primitiveMetadataAtom.onMount = (setAtom) => {
  // Load from storage
  AsyncStorage.getItem("metadata")
    .then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PrimitiveMetadata;
          verifyPrimitiveMetadata(parsed);
          const processed = preprocessMetadata({
            ...parsed,
            action: "init",
          });
          setAtom(processed);
        } catch (e) {
          console.warn("Failed to load metadata from storage", e);
        }
      }
    })
    .catch((e) => {
      console.error("Failed to read metadata from storage", e);
    });
};
