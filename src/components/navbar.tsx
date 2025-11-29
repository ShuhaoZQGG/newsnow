import { fixedColumnIds, regionColumnId } from "@shared/metadata"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { RegionSelector } from "./region-selector"
import { currentColumnIDAtom } from "~/atoms"

export function NavBar() {
  const { t } = useTranslation()
  const currentId = useAtomValue(currentColumnIDAtom)
  const { toggle } = useSearchBar()
  return (
    <span className={$([
      "flex p-3 rounded-2xl bg-primary/1 text-sm",
      "shadow shadow-primary/20 hover:shadow-primary/50 transition-shadow-500",
    ])}
    >
      <button
        type="button"
        onClick={() => toggle(true)}
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) op-70 dark:op-90",
          "cursor-pointer transition-all",
        )}
      >
        {t("common.search")}
      </button>
      {fixedColumnIds.map(columnId => (
        <Link
          key={columnId}
          to="/c/$column"
          params={{ column: columnId }}
          className={$(
            "px-2 hover:(bg-primary/10 rounded-md) cursor-pointer transition-all",
            currentId === columnId ? "color-primary font-bold" : "op-70 dark:op-90",
          )}
        >
          {t(`columns.${columnId}`)}
        </Link>
      ))}
      <Link
        to="/c/$column"
        params={{ column: regionColumnId }}
        className={$(
          "hover:(bg-primary/10 rounded-md) cursor-pointer transition-all flex items-center",
          currentId === regionColumnId ? "color-primary font-bold" : "",
        )}
      >
        <span className={$(
          "px-2",
          currentId === regionColumnId ? "" : "op-70 dark:op-90",
        )}
        >
          {t(`columns.${regionColumnId}`)}
        </span>
      </Link>
      <RegionSelector />
    </span>
  )
}
