import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useColorScheme } from "react-native";

type ThemeType = "light" | "dark";

const ThemeContext = createContext<{ theme: ThemeType; toggleTheme: () => void }>({
  theme: "light",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    if (systemTheme) setTheme(systemTheme);
  }, [systemTheme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);