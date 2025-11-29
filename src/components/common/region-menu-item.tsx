import { regions } from "@shared/metadata"
import type { Region } from "@shared/types"
import { useAtom } from "jotai"
import { regionAtom } from "~/atoms"

/**
 * Region selector menu item component
 * Displays a dropdown of supported regions in the settings menu
 */
export function RegionMenuItem() {
  const [selectedRegion, setSelectedRegion] = useAtom(regionAtom)

  const regionEntries = Object.entries(regions) as [Region, typeof regions[Region]][]

  const handleRegionChange = (region: Region) => {
    setSelectedRegion(region)
  }

  return (
    <li className="relative group">
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="i-ph:globe-duotone inline-block" />
        <span>{regions[selectedRegion].zh}</span>
        <span className="i-ph:caret-down inline-block text-xs" />
      </div>

      {/* Region dropdown */}
      <div className="absolute hidden group-hover:block left-0 top-full mt-1 w-150px bg-base bg-op-90! backdrop-blur-md rounded-lg shadow-lg z-100">
        <ul className="py-1">
          {regionEntries.map(([code, region]) => (
            <li
              key={code}
              onClick={() => handleRegionChange(code)}
              className={$([
                "px-4 py-2 cursor-pointer hover:bg-primary hover:bg-op-20 transition-all",
                selectedRegion === code && "bg-primary bg-op-10 font-semibold",
              ])}
            >
              <span className="flex items-center gap-2">
                <span>{region.zh}</span>
                {selectedRegion === code && (
                  <span className="i-ph:check inline-block text-sm" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
