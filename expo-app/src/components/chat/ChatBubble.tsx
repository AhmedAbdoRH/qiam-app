import React, { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Check, Copy, RotateCcw, Sparkles } from "lucide-react-native";
import { ChatMessage, isOwnMessage } from "./types";
import { formatMilestoneText, parseMilestoneTag } from "./MilestoneParser";

interface ChatBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Optional dependency — gracefully degrade when unavailable.
    const Clipboard = await import("expo-clipboard").catch(() => null);
    const mod = Clipboard as { setStringAsync?: (t: string) => Promise<void> } | null;
    if (mod?.setStringAsync) {
      await mod.setStringAsync(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Single message bubble: milestone badge, text, timestamp, copy/retry actions. */
export const ChatBubble: React.FC<ChatBubbleProps> = React.memo(({ message, onRetry }) => {
  const own = isOwnMessage(message);
  const parsed = parseMilestoneTag(message.message);
  const failed = message.status === "failed";
  const pending = message.status === "sending";

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(message.message);
    if (!ok) Alert.alert("الرسالة", message.message);
  }, [message.message]);

  const handleRetry = useCallback(() => {
    onRetry?.(message.id);
  }, [message.id, onRetry]);

  return (
    <View
      className={`my-1 max-w-[85%] rounded-2xl px-3 py-2 ${
        own
          ? "bg-amber-500/20 border border-amber-500/30 self-end"
          : "bg-zinc-900 border border-zinc-800 self-start"
      }${failed ? " border-red-500/60" : ""}`}
    >
      <View className="flex-row items-center justify-end gap-2">
        <View className="w-6 h-6 rounded-full bg-zinc-800 items-center justify-center">
          <Text className="text-amber-400 text-[10px] font-bold">
            {own ? "أنا" : "✦"}
          </Text>
        </View>
        {parsed.isSpecial && (
          <View className="flex-row items-center gap-1 bg-amber-500/15 rounded-full px-2 py-0.5">
            <Sparkles size={10} color="#F59E0B" />
            <Text className="text-amber-400 text-[10px] font-bold">{parsed.label}</Text>
          </View>
        )}
      </View>

      <Text className="text-white text-right mt-1">
        {parsed.isSpecial ? formatMilestoneText(message.message) : message.message}
      </Text>
      <Text className="text-zinc-500 text-[10px] text-right mt-1">
        {new Date(message.created_at).toLocaleString("ar-EG")}
      </Text>

      <View className="flex-row items-center justify-end gap-1 mt-1">
        {pending && <Text className="text-zinc-500 text-[10px]">جاري الإرسال…</Text>}
        {failed ? (
          <Pressable onPress={handleRetry} className="flex-row items-center gap-1 p-1">
            <RotateCcw size={12} color="#EF4444" />
            <Text className="text-red-400 text-[10px]">فشل — إعادة المحاولة</Text>
          </Pressable>
        ) : (
          <>
            {message.status === "sent" && <Check size={12} color="#52525B" />}
            <Pressable onPress={handleCopy} hitSlop={8} className="p-1">
              <Copy size={12} color="#71717A" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
});

ChatBubble.displayName = "ChatBubble";
