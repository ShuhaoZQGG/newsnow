import type { SourceID } from "@newsnow/shared/types";
import { useCallback } from "react";
import { refetchSources } from "../utils/data";
import { useUpdateQuery } from "./query";

export function useRefetch() {
  const updateQuery = useUpdateQuery();

  /**
   * force refresh
   */
  const refresh = useCallback(
    (...sources: SourceID[]) => {
      refetchSources.clear();
      sources.forEach((id) => refetchSources.add(id));
      updateQuery(...sources);
    },
    [updateQuery],
  );

  return {
    refresh,
    refetchSources,
  };
}
