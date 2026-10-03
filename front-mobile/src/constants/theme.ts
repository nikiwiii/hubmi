/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1C1917",
    background: "#F7F6F1",
    backgroundElement: "#EFECE6",
    backgroundSelected: "#E3DFD5",
    textSecondary: "#78716C",
    accent: "#EFE5C6",
    card: "#FFFFFF",
    border: "rgba(28, 25, 23, 0.08)",
  },
  dark: {
    text: "#FAF9F6",
    background: "#141413",
    backgroundElement: "#242320",
    backgroundSelected: "#33322D",
    textSecondary: "#A8A29E",
    accent: "#3E3B33",
    card: "#1F1E1C",
    border: "rgba(255, 255, 255, 0.08)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
