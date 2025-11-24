import { useAtomValue } from "jotai"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { translationProgressAtom } from "~/atoms/translationProgressAtom"

/**
 * Dev-only component that shows translation progress with a nice progress bar
 * Only visible when translations are in progress
 */
export function TranslationProgress() {
  const progress = useAtomValue(translationProgressAtom)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!progress) {
      setElapsed(0)
      return
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - progress.startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [progress])

  if (!import.meta.env.DEV || !progress) return null

  const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0
  const isComplete = progress.completed === progress.total
  const elapsedSeconds = (elapsed / 1000).toFixed(1)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-9999 min-w-96 max-w-lg"
      >
        <div className="bg-base border border-neutral-400/30 rounded-lg shadow-lg p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={isComplete ? "i-ph:check-circle-fill text-green-500" : "i-ph:spinner-gap-bold text-blue-500 animate-spin"} />
              <span className="font-medium text-sm">
                {isComplete ? "Translation Complete" : "Translating"}
                :
                {progress.sourceName}
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              {elapsedSeconds}
              s
            </span>
          </div>

          <div className="mb-2">
            <div className="h-2 bg-neutral-400/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${isComplete ? "bg-green-500" : "bg-blue-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              {progress.completed}
              {" "}
              /
              {progress.total}
              {" "}
              items
            </span>
            <span>
              {percentage.toFixed(0)}
              %
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
