import type { FixedColumnID, SourceID } from "@shared/types"
import { sources } from "@shared/sources"
import type { Update } from "./types"
import { regionAtom } from "./regionAtom"

export { regionAtom } from "./regionAtom"
export { topicAtom } from "./topicAtom"

export const focusSourcesAtom = atom((get) => {
  return get(primitiveMetadataAtom).data.focus
}, (get, set, update: Update<SourceID[]>) => {
  const _ = update instanceof Function ? update(get(focusSourcesAtom)) : update
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      focus: _,
    },
  })
})

export const currentColumnIDAtom = atom<FixedColumnID>("focus")

export const currentSourcesAtom = atom((get) => {
  const id = get(currentColumnIDAtom)
  const allSources = get(primitiveMetadataAtom).data[id]

  // Filter by region for all columns
  const selectedRegion = get(regionAtom)
  return allSources.filter((sourceId) => {
    const source = sources[sourceId]
    // If source doesn't have a region, it defaults to "global"
    const sourceRegion = source.region || "global"
    return sourceRegion === selectedRegion
  })
}, (get, set, update: Update<SourceID[]>) => {
  const _ = update instanceof Function ? update(get(currentSourcesAtom)) : update
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      [get(currentColumnIDAtom)]: _,
    },
  })
})

export const goToTopAtom = atom({
  ok: false,
  el: undefined as HTMLElement | undefined,
  fn: undefined as (() => void) | undefined,
})
