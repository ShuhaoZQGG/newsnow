import { Command } from "cmdk"
import { useMount } from "react-use"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import type { Region, SourceID } from "@newsnow/shared/types"
import { useMemo, useRef, useState } from "react"
import pinyin from "@newsnow/shared/pinyin.json"
import { hiddenColumns, regions } from "@newsnow/shared/metadata"
import { sources } from "@newsnow/shared/sources"
import { typeSafeObjectEntries } from "@newsnow/shared/type.util"
import * as Dialog from "@radix-ui/react-dialog"
import { OverlayScrollbar } from "../overlay-scrollbar"
import { CardWrapper } from "~/components/column/card"
import { regionAtom } from "~/atoms"
import { topicAtom } from "~/atoms/topicAtom"
import { useSearchBar } from "~/hooks/useSearch"
import { useFocusWith } from "~/hooks/useFocus"

import "./cmdk.css"

interface SourceItemProps {
  id: SourceID
  name: string
  title?: string
  column: string | null // Column ID or null for uncategorized
  pinyin: string
}

function groupByColumn(items: SourceItemProps[]) {
  return items.reduce((acc, item) => {
    const k = acc.find(i => i.column === item.column)
    if (k) k.sources = [...k.sources, item]
    else acc.push({ column: item.column, sources: [item] })
    return acc
  }, [] as {
    column: string | null
    sources: SourceItemProps[]
  }[]).sort((m, n) => {
    // Sort by column ID, prioritizing tech, then uncategorized last
    const mColumn = m.column || "uncategorized"
    const nColumn = n.column || "uncategorized"

    if (mColumn === "tech") return -1
    if (nColumn === "tech") return 1

    if (mColumn === "uncategorized") return 1
    if (nColumn === "uncategorized") return -1

    return mColumn < nColumn ? -1 : 1
  })
}

export function SearchBar() {
  const { t } = useTranslation()
  const { opened, toggle } = useSearchBar()
  const [selectedRegion, setSelectedRegion] = useAtom(regionAtom)
  const [selectedTopic, setSelectedTopic] = useAtom(topicAtom)

  const sourceItems = useMemo(
    () =>
      groupByColumn(typeSafeObjectEntries(sources)
        .filter(([_, source]) => !source.redirect)
        // Filter by selected region
        .filter(([_, source]) => {
          const sourceRegion = source.region || "global"
          return sourceRegion === selectedRegion
        })
        // Filter by selected topic
        .filter(([_, source]) => {
          if (selectedTopic === null) return true // Show all topics
          return source.column === selectedTopic
        })
        .map(([k, source]) => ({
          id: k,
          title: source.title,
          column: source.column || null, // Store column ID or null for uncategorized
          name: source.name,
          pinyin: pinyin?.[k as keyof typeof pinyin] ?? "",
        })))
    , [selectedRegion, selectedTopic],
  )
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [value, setValue] = useState<SourceID>("github-trending-today")

  useMount(() => {
    inputRef?.current?.focus()
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
    }
  })

  return (
    <Command.Dialog
      open={opened}
      onOpenChange={toggle}
      value={value}
      onValueChange={(v) => {
        if (v in sources) {
          setValue(v as SourceID)
        }
      }}
    >
      <Dialog.Title asChild>
        <span className="sr-only">{t("common.search")}</span>
      </Dialog.Title>
      <Command.Input
        ref={inputRef}
        autoFocus
        placeholder={t("search.placeholder")}
      />
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-base/10">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-neutral-400">
            {t("search.region")}
            :
          </span>
          <div className="flex gap-2">
            {(Object.keys(regions) as Region[]).map(region => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={$(
                  "text-sm px-2 py-0.5 rounded transition-all",
                  selectedRegion === region
                    ? "bg-primary/20 color-primary font-semibold"
                    : "hover:bg-primary/10 text-neutral-400",
                )}
              >
                {t(`regions.${region}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-neutral-400">
            {t("search.topic")}
            :
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className={$(
                "text-sm px-2 py-0.5 rounded transition-all",
                selectedTopic === null
                  ? "bg-primary/20 color-primary font-semibold"
                  : "hover:bg-primary/10 text-neutral-400",
              )}
            >
              {t("search.allTopics")}
            </button>
            {hiddenColumns.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={$(
                  "text-sm px-2 py-0.5 rounded transition-all",
                  selectedTopic === topic
                    ? "bg-primary/20 color-primary font-semibold"
                    : "hover:bg-primary/10 text-neutral-400",
                )}
              >
                {t(`columns.${topic}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="md:flex pt-2">
        <OverlayScrollbar defer className="overflow-y-auto md:min-w-275px">
          <Command.List>
            <Command.Empty>{t("search.noResults")}</Command.Empty>
            {
              sourceItems.map(({ column, sources }) => (
                <Command.Group
                  heading={column ? t(`columns.${column}`) : t("columns.uncategorized")}
                  key={column || "uncategorized"}
                >
                  {
                    sources.map(item => <SourceItem item={item} key={item.id} />)
                  }
                </Command.Group>
              ),
              )
            }
          </Command.List>
        </OverlayScrollbar>
        <div className="flex-1 pt-2 px-4 min-w-350px max-md:hidden">
          <CardWrapper id={value} />
        </div>
      </div>
    </Command.Dialog>
  )
}

function SourceItem({ item }: {
  item: SourceItemProps
}) {
  const { isFocused, toggleFocus } = useFocusWith(item.id)
  return (
    <Command.Item
      keywords={[item.name, item.title ?? "", item.pinyin]}
      value={item.id}
      className="flex justify-between items-center p-2"
      onSelect={toggleFocus}
    >
      <span className="flex gap-2 items-center">
        <span
          className={$("w-4 h-4 rounded-md bg-cover")}
          style={{
            backgroundImage: `url(/icons/${item.id.split("-")[0]}.png)`,
          }}
        />
        <span>{item.name}</span>
        <span className="text-xs text-neutral-400/80 self-end mb-3px">{item.title}</span>
      </span>
      <span className={$(isFocused ? "i-ph-star-fill" : "i-ph-star-duotone", "bg-primary op-40")}></span>
    </Command.Item>
  )
}
