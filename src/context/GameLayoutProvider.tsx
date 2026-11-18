import { useState } from "react";
import type { ReactNode } from "react";
import { GameLayoutContext } from "./GameLayoutContext";

export function GameLayoutProvider({ children }: { children: ReactNode }) {
  const [hideHeaderFooter, setHideHeaderFooter] = useState(false);

  return (
    <GameLayoutContext.Provider
      value={{ hideHeaderFooter, setHideHeaderFooter }}
    >
      {children}
    </GameLayoutContext.Provider>
  );
}
