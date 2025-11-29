import type { Region } from "@shared/types"
import { atomWithStorage } from "jotai/utils"

/**
 * Atom for storing the currently selected region
 * Persists to localStorage with default value of "global"
 */
export const regionAtom = atomWithStorage<Region>("region", "global")
