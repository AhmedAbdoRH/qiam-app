import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Archive, MessageCircle, WifiOff, X } from "lucide-react-native";
import { useSelfDialogue } from "./useSelfDialogue";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { ChatModeSelector } from "./ChatModeSelector";
import { CanonicalChatMode, ChatMode, MODE_LABEL, normalizeMode } from "./types";

export type { ChatMode } from "./types";

interface SelfDialogueChatProps {
  userId: string;
  /** Accepts legacy `self` alias too — normalized internally to `nafs`. */
  initialMode?: ChatMode;
}

/**
 * Main container: FAB launcher + full-screen modal wiring the
 * `useSelfDialogue` hook to the presentational chat components.
 */
export const SelfDialogueChat: React.FC<SelfDialogueChatProps> = ({
  userId,
  initialMode = "sovereign" as ChatMode,
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CanonicalChatMode>(normalizeMode(initialMode));

  const {
    messages,
    loading,
    loadingMore,
    sending,
    refreshing,
    isOffline,
    hasMore,
    error,
    sendMessage,
    retryMessage,
    loadMore,
    refresh,
    archiveActiveSession,
    clearError,
  } = useSelfDialogue({ userId, mode });

  // Inverted list: newest first so the newest message sits at the bottom.
  const invertedData = useMemo(() => [...messages].reverse(), [messages]);

  const confirmArchive = () => {
    Alert.alert("أرشفة", "سيتم أرشفة رسائل هذا النمط وبدء جلسة جديدة", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "أرشفة",
        style: "destructive",
        onPress: async () => {
          await archiveActiveSession();
        },
      },
    ]);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="فتح الحوار الذاتي"
        className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-amber-500 items-center justify-center shadow-lg z-50"
      >
        <MessageCircle size={26} color="#000" />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black pt-12">
          <View className="flex-row items-center justify-between px-4 pb-2 border-b border-zinc-800">
            <Pressable onPress={() => setOpen(false)} className="p-2">
              <X size={22} color="#fff" />
            </Pressable>
            <View className="items-center">
              <Text className="text-white font-bold">الحوار الذاتي — {MODE_LABEL[mode]}</Text>
              {isOffline && (
                <View className="flex-row items-center gap-1 mt-0.5">
                  <WifiOff size={10} color="#F59E0B" />
                  <Text className="text-amber-500 text-[10px]">وضع عدم الاتصال</Text>
                </View>
              )}
            </View>
            <Pressable onPress={confirmArchive} className="p-2">
              <Archive size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ChatModeSelector mode={mode} onChange={setMode} />

          {error && (
            <Pressable
              onPress={clearError}
              className="mx-3 mb-1 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2"
            >
              <Text className="text-red-400 text-xs text-right">{error}</Text>
            </Pressable>
          )}

          {loading && messages.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2">
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text className="text-zinc-400 text-sm">جاري تحميل الرسائل…</Text>
            </View>
          ) : invertedData.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <MessageCircle size={40} color="#3F3F46" />
              <Text className="text-zinc-400 text-sm text-center mt-3">
                لا توجد رسائل بعد في نمط {MODE_LABEL[mode]} — ابدأ حوارك الأول
              </Text>
            </View>
          ) : (
            <FlatList
              data={invertedData}
              keyExtractor={(item) => item.id}
              inverted
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 12 }}
              onEndReached={() => {
                if (hasMore && !loadingMore) void loadMore();
              }}
              onEndReachedThreshold={0.3}
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color="#F59E0B" style={{ margin: 8 }} />
                ) : null
              }
              renderItem={({ item }) => (
                <ChatBubble message={item} onRetry={(id) => void retryMessage(id)} />
              )}
            />
          )}

          <ChatInput onSend={(text) => void sendMessage(text)} sending={sending} />
        </View>
      </Modal>
    </>
  );
};
