import { useState } from "react"
import { regions } from "@newsnow/shared/metadata"
import type { Region } from "@newsnow/shared/types"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import { regionAtom } from "~/atoms"

/**
 * Region selector menu item component
 * Displays a dropdown of supported regions in the settings menu
 */
export function RegionMenuItem() {
  const { t } = useTranslation()
  const [selectedRegion, setSelectedRegion] = useAtom(regionAtom)
  const [isHovered, setIsHovered] = useState(false)

  const regionEntries = Object.entries(regions) as [Region, typeof regions[Region]][]

  const handleRegionChange = (region: Region) => {
    setSelectedRegion(region)
  }

  return (
    <li
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="i-ph:globe-duotone inline-block" />
        <span>{t(`regions.${selectedRegion}`)}</span>
        <span className="i-ph:caret-down inline-block text-xs" />
      </div>

      {/* Region dropdown */}
      {isHovered && (
        <div className="absolute left-0 top-full pt-1 w-150px z-100">
          <div className="bg-base bg-op-90! backdrop-blur-md rounded-lg shadow-lg">
            <ul className="py-1">
              {regionEntries.map(([code, _]) => (
                <li
                  key={code}
                  onClick={() => handleRegionChange(code)}
                  className={$([
                    "px-4 py-2 cursor-pointer hover:bg-primary hover:bg-op-20 transition-all",
                    selectedRegion === code && "bg-primary bg-op-10 font-semibold",
                  ])}
                >
                  <span className="flex items-center gap-2">
                    <span>{t(`regions.${code}`)}</span>
                    {selectedRegion === code && (
                      <span className="i-ph:check inline-block text-sm" />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}
