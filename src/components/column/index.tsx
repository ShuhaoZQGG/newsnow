import type { FixedColumnID } from "@shared/types"
import { useTitle } from "react-use"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import { useEffect } from "react"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { currentColumnIDAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const { t } = useTranslation()
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  useEffect(() => {
    setCurrentColumnID(id)
  }, [id, setCurrentColumnID])

  useTitle(`NewsNow | ${t(`columns.${id}`)}`)

  return (
    <>
      <div className="flex justify-center md:hidden mb-6">
        <NavBar />
      </div>
      {id === currentColumnID && <Dnd />}
    </>
  )
}
