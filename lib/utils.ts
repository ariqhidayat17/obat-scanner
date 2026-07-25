import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Alert, Platform } from "react-native";

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Platform-independent Alert implementation that works on Native and Web.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: Array<{
    text?: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
  }>
) {
  if (Platform.OS === "web") {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const confirmText = buttons.map((b) => b.text || "OK").join(" / ");
      const result = window.confirm(`${fullMessage}\n\n(${confirmText})`);
      if (result) {
        const okBtn = buttons.find((b) => b.style !== "cancel") || buttons[0];
        if (okBtn?.onPress) okBtn.onPress();
      } else {
        const cancelBtn =
          buttons.find((b) => b.style === "cancel") ||
          buttons[1] ||
          buttons[0];
        if (cancelBtn?.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(fullMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
