import { regions } from "@shared/metadata"
import type { Region } from "@shared/types"
import { regionAtom } from "~/atoms"

export function RegionSelector() {
  const [selectedRegion, setSelectedRegion] = useAtom(regionAtom)
  const [shown, setShown] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <button
        type="button"
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) cursor-pointer transition-all",
          "op-70 dark:op-90 flex items-center gap-1",
        )}
      >
        <span>{regions[selectedRegion].zh}</span>
        <div className="i-ph:caret-down text-xs" />
      </button>

      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-2 top-full">
          <div className={$(
            "min-w-[120px] bg-base backdrop-blur-md bg-op-90! rounded-lg shadow-lg",
            "border border-primary/10 py-1",
          )}
          >
            {(Object.keys(regions) as Region[]).map(region => (
              <div
                key={region}
                onClick={() => {
                  setSelectedRegion(region)
                  setShown(false)
                }}
                className={$(
                  "px-3 py-2 text-sm cursor-pointer transition-colors",
                  "hover:(bg-primary/10)",
                  selectedRegion === region && "color-primary font-bold",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{regions[region].zh}</span>
                  {selectedRegion === region && (
                    <div className="i-ph:check text-base" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
