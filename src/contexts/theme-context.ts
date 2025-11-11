import { createContext } from "react";
import { ThemeContextType } from "./theme-utils";

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);
