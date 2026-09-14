import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { CANONICAL_MODES, CanonicalChatMode, MODE_LABEL } from "./types";

interface ChatModeSelectorProps {
  mode: CanonicalChatMode;
  onChange: (mode: CanonicalChatMode) => void;
}

/** Horizontal pill selector for switching dialogue modes. */
export const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row-reverse" }}
    >
      {CANONICAL_MODES.map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`px-3 py-1.5 rounded-full border ${
              active ? "bg-amber-500 border-amber-500" : "border-zinc-700"
            }`}
          >
            <Text className={active ? "text-black text-xs font-bold" : "text-zinc-300 text-xs"}>
              {MODE_LABEL[m]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
