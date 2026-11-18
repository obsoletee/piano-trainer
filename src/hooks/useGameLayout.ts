import { useContext } from "react";
import { GameLayoutContext } from "../context/GameLayoutContext";

export function useGameLayout() {
  const context = useContext(GameLayoutContext);

  if (!context) {
    throw new Error(
      "useGameLayout должен использоваться внутри GameLayoutProvider",
    );
  }

  return context;
}
