import { useMount } from "react-use"
import { useTranslation } from "react-i18next"

/**
 * changed every minute
 */
const timerAtom = atom(0)

timerAtom.onMount = (set) => {
  const timer = setInterval(() => {
    set(Date.now())
  }, 60 * 1000)
  return () => clearInterval(timer)
}

function useVisibility() {
  const [visible, setVisible] = useState(true)
  useMount(() => {
    const handleVisibilityChange = () => {
      setVisible(document.visibilityState === "visible")
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  })
  return visible
}

function getRelativeTime(timestamp: string | number, t: any) {
  if (!timestamp) return undefined
  const date = new Date(timestamp)
  if (Number.isNaN(date.getDay())) return undefined

  const now = new Date()
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000
  const diffInMinutes = diffInSeconds / 60
  const diffInHours = diffInMinutes / 60

  if (diffInSeconds < 60) {
    return t("time.justNow")
  } else if (diffInMinutes < 60) {
    const minutes = Math.floor(diffInMinutes)
    return t("time.minutesAgo", { count: minutes })
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return t("time.hoursAgo", { count: hours })
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return t("time.monthDay", { month, day })
  }
}

export function useRelativeTime(timestamp: string | number) {
  const { t } = useTranslation()
  const [time, setTime] = useState<string>()
  const timer = useAtomValue(timerAtom)
  const visible = useVisibility()

  useEffect(() => {
    if (visible) {
      const t_time = getRelativeTime(timestamp, t)
      if (t_time) {
        setTime(t_time)
      }
    }
  }, [timestamp, timer, visible, t])

  return time
}
