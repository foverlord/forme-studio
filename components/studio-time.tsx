"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getClientNow, getServerNow } from "@/lib/time";

type StudioTime = { now: Date | null; hydrated: boolean };

const StudioTimeContext = createContext<StudioTime>({ now: null, hydrated: false });

function subscribe() {
  return () => {};
}

export function StudioTimeProvider({ children }: { children: React.ReactNode }) {
  const stamp = useSyncExternalStore(subscribe, getClientNow, getServerNow);
  const value: StudioTime = stamp === 0 ? { now: null, hydrated: false } : { now: new Date(stamp), hydrated: true };
  return <StudioTimeContext.Provider value={value}>{children}</StudioTimeContext.Provider>;
}

export function useStudioTime(): StudioTime {
  return useContext(StudioTimeContext);
}
