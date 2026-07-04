"use client";

import { useContext } from "react";
import { TrackerStoreContext, type TrackerStoreApi } from "../store/tracker-store";

export function useTracker(): TrackerStoreApi {
  const value = useContext(TrackerStoreContext);
  if (!value) throw new Error("useTracker must be used within TrackerStoreProvider");
  return value;
}
