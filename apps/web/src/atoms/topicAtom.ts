import type { HiddenColumnID } from "@newsnow/shared/types"
import { atomWithStorage } from "jotai/utils"

/**
 * Atom for storing the currently selected topic/column filter
 * Persists to localStorage with default value of null (all topics)
 */
export const topicAtom = atomWithStorage<HiddenColumnID | null>("topic", null)
