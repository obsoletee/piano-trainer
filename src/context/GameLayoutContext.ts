import { createContext } from "react";

export interface GameLayoutContextType {
  hideHeaderFooter: boolean;
  setHideHeaderFooter: (hide: boolean) => void;
}

export const GameLayoutContext = createContext<GameLayoutContextType | null>(
  null,
);
