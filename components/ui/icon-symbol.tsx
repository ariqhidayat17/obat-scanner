// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for ObatScan app.
 */
const MAPPING = {
  "house.fill": "home",
  "camera.fill": "camera-alt",
  "clock.fill": "history",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "doc.text.fill": "description",
  "xmark": "close",
  "arrow.clockwise": "refresh",
  "doc.on.doc": "content-copy",
  "trash": "delete",
  "photo": "photo-library",
  "bolt.fill": "flash-on",
  "bolt.slash.fill": "flash-off",
  "arrow.triangle.2.circlepath.camera": "flip-camera-ios",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "bell.fill": "notifications",
  "message.fill": "chat",
  "cross.case.fill": "medical-services",
  "arrow.up": "arrow-upward",
  "arrow.right": "arrow-forward",
  "plus": "add",
  "minus": "remove",
  "xmark.octagon.fill": "report",
  "lightbulb.fill": "lightbulb",
  "info.circle.fill": "info",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
