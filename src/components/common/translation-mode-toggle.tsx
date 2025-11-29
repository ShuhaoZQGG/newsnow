import { useAtom } from "jotai"
import { translationModeAtom } from "~/atoms/languageAtom"

/**
 * Dev-only toggle to switch between lazy and eager translation modes
 * Only visible in development environment
 */
export function TranslationModeToggle() {
  const [mode, setMode] = useAtom(translationModeAtom)

  // Only show in development
  if (!import.meta.env.DEV) {
    return null
  }

  const toggleMode = () => {
    setMode(mode === "lazy" ? "eager" : "lazy")
  }

  return (
    <div
      className={$(
        "fixed bottom-4 right-4 z-999",
        "bg-base bg-op-90 backdrop-blur-md",
        "border border-primary/20 rounded-lg shadow-lg",
        "p-3 text-xs font-mono",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-neutral-400">Translation Mode:</span>
        <button
          type="button"
          onClick={toggleMode}
          className={$(
            "px-3 py-1 rounded transition-all",
            mode === "lazy"
              ? "bg-blue-500/20 text-blue-400 border border-blue-400/50"
              : "bg-green-500/20 text-green-400 border border-green-400/50",
          )}
        >
          {mode === "lazy" ? "⏱️ Lazy (On-demand)" : "⚡ Eager (Pre-translate)"}
        </button>
      </div>
      <div className="mt-1 text-neutral-500 text-xs">
        {mode === "lazy"
          ? "Translates when viewing each item"
          : "Pre-translates all items at once"}
      </div>
    </div>
  )
}
