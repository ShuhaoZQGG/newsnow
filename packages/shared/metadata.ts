import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { ColumnID, HiddenColumnID, Metadata, Region, SourceID } from "./types"

export const regions: Record<Region, { zh: string, en: string }> = {
  global: {
    zh: "全球",
    en: "Global",
  },
  china: {
    zh: "中国",
    en: "China",
  },
} as const

// Column IDs - translations are handled via i18n
export const columns = {
  china: "china",
  world: "world",
  tech: "tech",
  finance: "finance",
  focus: "focus",
  realtime: "realtime",
  hottest: "hottest",
} as const

// Default English names for server-side usage (fallback)
const columnDefaultNames: Record<keyof typeof columns, string> = {
  china: "Domestic",
  world: "International",
  tech: "Technology",
  finance: "Finance",
  focus: "Focus",
  realtime: "Real-time",
  hottest: "Hottest",
}

export const fixedColumnIds = ["focus", "hottest"] as const satisfies Partial<ColumnID>[]
export const regionColumnId = "realtime" as const satisfies ColumnID
// All columns that can be navigated to via URL
export const navigableColumnIds = [...fixedColumnIds, regionColumnId] as const
export const hiddenColumns = Object.keys(columns).filter(id => !navigableColumnIds.includes(id as any)) as HiddenColumnID[]

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k]) => {
  switch (k) {
    case "focus":
      return [k, {
        name: columnDefaultNames[k],
        sources: [] as SourceID[],
      }]
    case "hottest":
      return [k, {
        name: columnDefaultNames[k],
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.type === "hottest" && !v.redirect).map(([k]) => k),
      }]
    case "realtime":
      return [k, {
        name: columnDefaultNames[k],
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.type === "realtime" && !v.redirect).map(([k]) => k),
      }]
    default:
      return [k, {
        name: columnDefaultNames[k],
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k),
      }]
  }
}))
